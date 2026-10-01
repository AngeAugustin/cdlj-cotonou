/**
 * Cache court des validations session/compte pour éviter 2 requêtes Mongo
 * à chaque getServerSession / refresh JWT.
 *
 * - Positif : TTL ~60s (révocation / désactivation au plus sous 1 min)
 * - Négatif : TTL ~5s (évite de marteler Mongo sur session morte)
 * - Si Mongo est down et qu’on avait un OK récent (<2 min) : on laisse passer
 */

type CacheEntry = {
  ok: boolean;
  checkedAt: number;
};

const POSITIVE_TTL_MS = 60_000;
const NEGATIVE_TTL_MS = 5_000;
const STALE_GRACE_MS = 120_000;
const MAX_KEYS = 5_000;

const cache = new Map<string, CacheEntry>();

function cacheKey(userId: string, sessionId: string) {
  return `${userId}:${sessionId}`;
}

function pruneIfNeeded() {
  if (cache.size < MAX_KEYS) return;
  const now = Date.now();
  for (const [key, entry] of cache) {
    const ttl = entry.ok ? POSITIVE_TTL_MS : NEGATIVE_TTL_MS;
    if (now - entry.checkedAt >= ttl) cache.delete(key);
  }
  if (cache.size < MAX_KEYS) return;
  let i = 0;
  for (const key of cache.keys()) {
    cache.delete(key);
    if (++i >= Math.floor(MAX_KEYS / 2)) break;
  }
}

export function seedSessionValidation(userId: string, sessionId: string) {
  if (!userId || !sessionId) return;
  pruneIfNeeded();
  cache.set(cacheKey(userId, sessionId), { ok: true, checkedAt: Date.now() });
}

export function invalidateSessionValidation(sessionId: string) {
  if (!sessionId) return;
  for (const key of cache.keys()) {
    if (key.endsWith(`:${sessionId}`)) cache.delete(key);
  }
}

export function invalidateUserSessionValidations(userId: string) {
  if (!userId) return;
  const prefix = `${userId}:`;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

export async function validateAuthSessionCached(
  userId: string,
  sessionId: string,
  check: () => Promise<boolean>
): Promise<boolean> {
  if (!userId || !sessionId) return false;

  const key = cacheKey(userId, sessionId);
  const now = Date.now();
  const cached = cache.get(key);

  if (cached) {
    const ttl = cached.ok ? POSITIVE_TTL_MS : NEGATIVE_TTL_MS;
    if (now - cached.checkedAt < ttl) {
      return cached.ok;
    }
  }

  try {
    const ok = await check();
    pruneIfNeeded();
    cache.set(key, { ok, checkedAt: Date.now() });
    return ok;
  } catch {
    // Mongo indisponible : tolère un OK récent plutôt que d’éjecter le dashboard
    if (cached?.ok && now - cached.checkedAt < STALE_GRACE_MS) {
      return true;
    }
    return false;
  }
}
