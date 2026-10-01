import { randomBytes, timingSafeEqual } from "crypto";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { canViewActivites } from "@/lib/rolePermissions";

export function generatePresenceToken(): string {
  return randomBytes(24).toString("base64url");
}

export function presenceTokensEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length || left.length === 0) return false;
  return timingSafeEqual(left, right);
}

export function extractPresenceToken(request: Request, bodyToken?: string | null): string | null {
  const header = request.headers.get("x-presence-token")?.trim();
  if (header) return header;
  const urlToken = new URL(request.url).searchParams.get("token")?.trim();
  if (urlToken) return urlToken;
  const fromBody = typeof bodyToken === "string" ? bodyToken.trim() : "";
  return fromBody || null;
}

/** Staff connecté (rôles présence) OU token d’activité valide. */
export async function authorizePresenceScan(
  request: Request,
  activitePresenceToken: string | null | undefined,
  providedToken: string | null
): Promise<{ ok: true } | { ok: false; status: 401 | 403; error: string }> {
  const session = await getServerSession(authOptions);
  const roles = Array.isArray(session?.user?.roles) ? session.user.roles : [];
  if (session?.user && canViewActivites(roles)) {
    return { ok: true };
  }

  if (!activitePresenceToken) {
    return { ok: false, status: 403, error: "Jeton de présence non configuré pour cette activité." };
  }
  if (!providedToken || !presenceTokensEqual(activitePresenceToken, providedToken)) {
    return {
      ok: false,
      status: 401,
      error: "Jeton de présence invalide ou manquant. Utilisez le lien / QR officiel de l’activité.",
    };
  }
  return { ok: true };
}
