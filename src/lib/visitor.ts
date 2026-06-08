import { createHash, randomUUID } from "crypto";
import { cookies } from "next/headers";
import { CONSENT_COOKIE, type ConsentStatus } from "@/lib/cookie-consent";

export const VISITOR_COOKIE = "cdlj_visitor_id";

export type VisitorGeo = {
  country: string | null;
  city: string | null;
  region: string | null;
};

export type VisitorContext = {
  visitorId: string;
  ipHash: string;
  geo: VisitorGeo;
};

function hashIp(ip: string): string {
  const secret = process.env.NEXTAUTH_SECRET ?? "cdlj-visitor";
  return createHash("sha256").update(`${secret}:${ip}`).digest("hex");
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function getGeoFromRequest(request: Request): VisitorGeo {
  const decode = (value: string | null) => {
    if (!value) return null;
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };

  return {
    country:
      request.headers.get("x-vercel-ip-country") ??
      request.headers.get("cf-ipcountry") ??
      null,
    city: decode(request.headers.get("x-vercel-ip-city")),
    region:
      decode(request.headers.get("x-vercel-ip-country-region")) ??
      request.headers.get("x-vercel-ip-region") ??
      null,
  };
}

export async function getConsentStatus(): Promise<ConsentStatus> {
  const cookieStore = await cookies();
  const value = cookieStore.get(CONSENT_COOKIE)?.value;
  if (value === "accepted" || value === "rejected") return value;
  return null;
}

export async function hasCookieConsent(): Promise<boolean> {
  return (await getConsentStatus()) === "accepted";
}

export async function getOrCreateVisitorId(): Promise<string | null> {
  if (!(await hasCookieConsent())) return null;

  const cookieStore = await cookies();
  const existing = cookieStore.get(VISITOR_COOKIE)?.value;
  if (existing) return existing;

  const id = randomUUID();
  cookieStore.set(VISITOR_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return id;
}

export async function getVisitorContext(request: Request): Promise<VisitorContext | null> {
  const visitorId = await getOrCreateVisitorId();
  if (!visitorId) return null;

  const ip = getClientIp(request);
  return {
    visitorId,
    ipHash: hashIp(ip),
    geo: getGeoFromRequest(request),
  };
}
