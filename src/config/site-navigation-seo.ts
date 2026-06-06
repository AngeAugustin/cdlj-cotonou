/**
 * Pages principales mises en avant pour Google (sitelinks potentiels).
 * Aligné sur la navigation publique + footer.
 */
export type SiteNavSeoItem = {
  href: string;
  name: string;
  description: string;
};

import { VICARIATS_TOTAL } from "@/config/community-stats";

export const SITE_NAV_SEO: SiteNavSeoItem[] = [
  {
    href: "/",
    name: "Accueil",
    description:
      "CDLJ Cotonou — Communauté Diocésaine des Lecteurs Juniors : formation liturgique et vie de la communauté.",
  },
  {
    href: "/about",
    name: "À propos",
    description:
      "Histoire, mission, valeurs et équipe diocésaine de la CDLJ depuis 2013 à Cotonou.",
  },
  {
    href: "/nos-vicariats",
    name: "Nos vicariats",
    description:
      `Carte des ${VICARIATS_TOTAL} vicariats forains, paroisses affiliées et coordonnées pastorales.`,
  },
  {
    href: "/news",
    name: "Actualités",
    description:
      "Blog et actualités officielles : événements, assemblées et nouvelles de la CDLJ.",
  },
  {
    href: "/mediatheque",
    name: "Médiathèque",
    description:
      "Photos, vidéos et archives des sessions diocésaines et activités de la CDLJ.",
  },
  {
    href: "/forums",
    name: "Forums",
    description:
      "Forums et espaces d'échange pour les lecteurs juniors et responsables de la CDLJ.",
  },
  {
    href: "/resultats",
    name: "Résultats",
    description:
      "Consultation publique des résultats d'évaluation de l'année en cours par numéro lecteur.",
  },
];
