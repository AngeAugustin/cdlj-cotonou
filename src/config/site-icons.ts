import { CDLJ_LOGO_SRC } from "@/config/brand";

/** Chemins des favicons (multiples de 48 px — exigence Google Search). */
export const SITE_ICONS = {
  /** Fichier principal servi sur /favicon.ico */
  favicon: "/branding/favicon-48.png",
  icon48: "/branding/favicon-48.png",
  icon96: "/branding/favicon-96.png",
  icon192: "/branding/favicon-192.png",
  icon512: "/branding/favicon-512.png",
  appleTouch: "/branding/favicon-192.png",
  /** Logo haute résolution pour schema.org Organization */
  logo: CDLJ_LOGO_SRC,
} as const;
