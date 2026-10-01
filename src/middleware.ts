import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import {
  canManageActualites,
  isDirectionSpirituelle,
  isRedacteurForbiddenPath,
  isRedacteurOnly,
  isSpiritualDirectionForbiddenPath,
} from "@/lib/rolePermissions";

/** Préfixes API accessibles sans session (auth propre à la route). */
const PUBLIC_API_PREFIXES = [
  "/api/auth",
  "/api/public",
  "/api/webhooks",
  "/api/jobs",
  "/api/dev",
] as const;

/** GET publics (contenu publié) — pas les sous-routes `[id]`. */
const PUBLIC_GET_EXACT = new Set(["/api/actualites", "/api/mediatheque"]);

const DASHBOARD_PREFIXES = [
  "/dashboard",
  "/lecteurs",
  "/calendrier",
  "/paroisses",
  "/vicariats",
  "/activites",
  "/assemblees",
  "/cotisations",
  "/grades",
  "/evaluations",
  "/actualites",
  "/gestion-mediatheque",
  "/utilisateurs",
  "/profil",
] as const;

function isPublicApi(req: NextRequest): boolean {
  const pathname = req.nextUrl.pathname;
  if (PUBLIC_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  const method = req.method.toUpperCase();
  if ((method === "GET" || method === "HEAD" || method === "OPTIONS") && PUBLIC_GET_EXACT.has(pathname)) {
    return true;
  }
  return false;
}

function isDashboardPath(pathname: string): boolean {
  return DASHBOARD_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function noStoreHeaders(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  return res;
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // ── API ────────────────────────────────────────────────────────────
  if (pathname.startsWith("/api/")) {
    if (isPublicApi(req)) {
      return NextResponse.next();
    }

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || !token?.sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // ── Pages dashboard ────────────────────────────────────────────────
  if (!isDashboardPath(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.id || !token?.sessionId) {
    const login = new URL("/auth/login", req.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  const roles = Array.isArray(token.roles) ? (token.roles as string[]) : [];
  const isVicariatPage = pathname.startsWith("/vicariats");
  const isVicarial = roles.includes("VICARIAL");

  if (isVicariatPage && isVicarial) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isDirectionSpirituelle(roles) && isSpiritualDirectionForbiddenPath(pathname)) {
    const allowActualitesWrite =
      canManageActualites(roles) && pathname.startsWith("/actualites");
    if (!allowActualitesWrite) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  if (isRedacteurOnly(roles) && isRedacteurForbiddenPath(pathname)) {
    return NextResponse.redirect(new URL("/actualites", req.url));
  }

  return noStoreHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/api/:path*",
    "/dashboard/:path*",
    "/lecteurs/:path*",
    "/calendrier/:path*",
    "/paroisses/:path*",
    "/vicariats/:path*",
    "/activites/:path*",
    "/assemblees/:path*",
    "/cotisations/:path*",
    "/grades/:path*",
    "/evaluations/:path*",
    "/actualites/:path*",
    "/gestion-mediatheque/:path*",
    "/utilisateurs/:path*",
    "/profil/:path*",
  ],
};
