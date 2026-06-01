import { lecteursSeoPhrase, PAROISHES_TOTAL, VICARIATS_TOTAL } from "@/config/community-stats";
import { FACEBOOK_URL, TIKTOK_URL } from "@/config/social-links";

/** Nom court affiché dans les titres et partages sociaux. */
export const SITE_NAME = "CDLJ Cotonou";

/** Nom officiel complet de l'organisation. */
export const SITE_NAME_FULL =
  "Communauté Diocésaine des Lecteurs Juniors";

/** Slogan principal de la communauté. */
export const SITE_TAGLINE = "Lecteurs, Sel & Lumière nous sommes";

/** Organisation mère. */
export const PARENT_ORG =
  "Aumônerie de l'Enfance Missionnaire de Cotonou";

/** Description par défaut pour les moteurs de recherche et réseaux sociaux. */
export const SITE_DESCRIPTION =
  `Plateforme officielle de la Communauté Diocésaine des Lecteurs Juniors (CDLJ) de l'Archidiocèse de Cotonou. Formation, animation et fédération de ${lecteursSeoPhrase()} répartis dans ${VICARIATS_TOTAL} vicariats forains et ${PAROISHES_TOTAL} paroisses.`;

/** Image Open Graph par défaut (1200×630). */
export const DEFAULT_OG_IMAGE = "/branding/og-default.jpg";
export const DEFAULT_OG_IMAGE_WIDTH = 1200;
export const DEFAULT_OG_IMAGE_HEIGHT = 630;

/** Locale principale du site. */
export const SITE_LOCALE = "fr_BJ" as const;
export const SITE_LANGUAGE = "fr" as const;

/** Coordonnées publiques. */
export const SITE_CONTACT = {
  email: "contact@cdlj-cotonou.com",
  phone: "+22900000000",
  address: {
    streetAddress: "Centre Paul VI",
    addressLocality: "Cotonou",
    addressCountry: "BJ",
  },
} as const;

export const SITE_SOCIAL = {
  facebook: FACEBOOK_URL,
  tiktok: TIKTOK_URL,
} as const;

/** Mots-clés thématiques (usage metadata, faible poids Google mais utile pour cohérence). */
export const SITE_KEYWORDS = [
  "CDLJ",
  "lecteurs juniors",
  "Cotonou",
  "Archidiocèse de Cotonou",
  "Enfance Missionnaire",
  "lecteurs liturgiques",
  "vicariats forains",
  "communauté diocésaine",
  "Bénin",
  "formation liturgique",
] as const;

/** Couleur de thème pour le manifest et la barre mobile. */
export const SITE_THEME_COLOR = "#78350f";
