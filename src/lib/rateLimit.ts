type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

const MAX_KEYS = 10_000;

function pruneIfNeeded(now: number) {
  if (store.size < MAX_KEYS) return;
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key);
  }
  if (store.size < MAX_KEYS) return;
  // Drop oldest half if still too large (best-effort under abuse).
  let i = 0;
  for (const key of store.keys()) {
    store.delete(key);
    if (++i >= Math.floor(MAX_KEYS / 2)) break;
  }
}

export type RateLimitResult =
  | { ok: true; remaining: number; retryAfterSec: number }
  | { ok: false; remaining: 0; retryAfterSec: number };

/**
 * Limiteur en mémoire par processus (suffisant sur une instance ; sur Vercel
 * multi-instances, chaque instance a son propre compteur).
 */
export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): RateLimitResult {
  const now = Date.now();
  pruneIfNeeded(now);

  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSec: Math.ceil(windowMs / 1000) };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return {
    ok: true,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

export function clientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function rateLimitResponse(retryAfterSec: number) {
  return Response.json(
    { error: "Trop de tentatives. Réessayez plus tard." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSec) },
    }
  );
}
