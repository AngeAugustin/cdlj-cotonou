import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const roles = Array.isArray(req.nextauth?.token?.roles)
      ? (req.nextauth.token.roles as string[])
      : [];
    const isVicariatPage = req.nextUrl.pathname.startsWith("/vicariats");
    const isVicarial = roles.includes("VICARIAL");

    if (isVicariatPage && isVicarial) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    const response = NextResponse.next();
    // Empêche le navigateur de mettre en cache les pages protégées
    // Cela bloque le retour arrière vers une page connectée après déconnexion
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  },
  {
    pages: {
      signIn: "/auth/login",
    },
  }
);

export const config = {
  // Protège uniquement les routes privées (dashboard et ses sous-routes)
  // Les routes publiques (/, /about, /news, /forums, /auth, /api) sont libres d'accès
  matcher: [
    "/dashboard/:path*",
    "/lecteurs/:path*",
    "/paroisses/:path*",
    "/vicariats/:path*",
    "/activites/:path*",
    "/assemblees/:path*",
    "/cotisations/:path*",
    "/grades/:path*",
    "/evaluations/:path*",
    "/utilisateurs/:path*",
    "/profil/:path*",
  ],
};
