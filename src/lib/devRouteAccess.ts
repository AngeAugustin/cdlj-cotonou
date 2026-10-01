import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

function secretsEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length || left.length === 0) return false;
  return timingSafeEqual(left, right);
}

/**
 * Routes /api/dev/* :
 * - ouvertes uniquement en `development` local
 * - ou en prod/preview si `EMAIL_PREVIEW_SECRET` est fourni via header `x-dev-secret`
 *   (jamais via query string — fuite logs/Referer)
 */
export function assertDevRouteAccess(request: Request): NextResponse | null {
  if (process.env.NODE_ENV === "development") {
    return null;
  }

  const configured = process.env.EMAIL_PREVIEW_SECRET?.trim();
  if (!configured) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const header = request.headers.get("x-dev-secret")?.trim() ?? "";
  if (!header || !secretsEqual(header, configured)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return null;
}
