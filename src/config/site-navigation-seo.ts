/**
 * Pages principales mises en avant pour Google (sitelinks potentiels).
 * Aligné sur la navigation publique + footer.
 */
export type SiteNavSeoItem = {
  href: string;
  name: string;
  description: string;
};

export const SITE_NAV_SEO: SiteNavSeoItem[] = [
  {
    href: "/",
    name: "Accueil",
    description:
      "Communauté Diocésaine des Lecteurs Juniors — formation, animation et vie de la CDLJ à Cotonou.",
  },
  {
    href: "/about",
    name: "À propos",
    description:
      "Histoire, mission et valeurs de la CDLJ depuis 2013 dans l'Archidiocèse de Cotonou.",
  },
  {
    href: "/nos-vicariats",
    name: "Nos vicariats",
    description:
      "Carte et fiches des 15 vicariats forains, paroisses affiliées et coordonnées.",
  },
  {
    href: "/news",
    name: "Blog & Actualités",
    description:
      "Dernières nouvelles, événements et annonces de la communauté diocésaine.",
  },
  {
    href: "/mediatheque",
    name: "Médiathèque",
    description:
      "Photos, vidéos et archives des sessions et activités de la CDLJ.",
  },
  {
    href: "/forums",
    name: "Forums",
    description:
      "Espaces d'échange et de discussion pour les membres de la communauté.",
  },
];
