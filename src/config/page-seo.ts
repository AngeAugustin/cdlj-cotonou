/**
 * Titres, descriptions et mots-clés par page publique.
 * Descriptions ciblées ~150–160 caractères pour les extraits Google.
 */
import {
  FOUNDED_YEAR,
  lecteursSeoPhrase,
  PAROISHES_TOTAL,
  VICARIATS_TOTAL,
} from "@/config/community-stats";
import { SITE_NAME, SITE_NAME_FULL } from "@/config/seo";

export type PageSeoEntry = {
  title: string;
  description: string;
  keywords: string[];
};

export const PAGE_SEO = {
  home: {
    title: "Lecteurs Juniors à Cotonou — Sel & Lumière",
    description: `${SITE_NAME_FULL} (${SITE_NAME}) : formation liturgique, animation paroissiale et fédération de ${lecteursSeoPhrase()} dans ${VICARIATS_TOTAL} vicariats forains de l'Archidiocèse de Cotonou.`,
    keywords: [
      "CDLJ Cotonou",
      "lecteurs juniors Bénin",
      "communauté diocésaine",
      "Enfance Missionnaire Cotonou",
      "formation liturgique",
    ],
  },
  about: {
    title: "À propos — histoire, mission et valeurs",
    description: `Histoire de la CDLJ depuis ${FOUNDED_YEAR}, mission d'encadrement des lecteurs juniors, valeurs et équipe diocésaine au service de l'Archidiocèse de Cotonou et de l'Enfance Missionnaire.`,
    keywords: [
      "CDLJ histoire",
      "mission lecteurs juniors",
      "Enfance Missionnaire Cotonou",
      "communauté diocésaine Bénin",
      "formation jeunes lecteurs",
    ],
  },
  news: {
    title: "Actualités & blog de la communauté",
    description:
      "Suivez les actualités, événements, assemblées et annonces de la Communauté Diocésaine des Lecteurs Juniors de Cotonou. Blog officiel de la CDLJ.",
    keywords: [
      "actualités CDLJ",
      "événements lecteurs juniors",
      "blog communauté diocésaine",
      "nouvelles Archidiocèse Cotonou",
    ],
  },
  vicariats: {
    title: "Nos vicariats forains — carte et paroisses",
    description: `Carte et fiches des ${VICARIATS_TOTAL} vicariats forains de l'Archidiocèse de Cotonou : ${PAROISHES_TOTAL} paroisses, zones pastorales, coordonnées et organisation territoriale de la CDLJ.`,
    keywords: [
      "vicariats forains Cotonou",
      "paroisses Archidiocèse de Cotonou",
      "carte vicariats CDLJ",
      "organisation diocésaine Bénin",
      "lecteurs juniors par vicariat",
    ],
  },
  mediatheque: {
    title: "Médiathèque — photos et archives CDLJ",
    description:
      "Photos, vidéos et archives des sessions diocésaines, célébrations et activités de la CDLJ. Médiathèque officielle de la Communauté Diocésaine des Lecteurs Juniors de Cotonou.",
    keywords: [
      "médiathèque CDLJ",
      "photos lecteurs juniors Cotonou",
      "archives communauté diocésaine",
      "vidéos CDLJ",
      "session diocésaine photos",
    ],
  },
  forums: {
    title: "Forums et espaces d'échange",
    description:
      "Forums de la CDLJ : échanges entre lecteurs juniors, responsables vicariaux, formateurs et commissionnaires. Rejoignez la vie numérique de la communauté diocésaine de Cotonou.",
    keywords: [
      "forum CDLJ",
      "communauté lecteurs juniors",
      "échanges vicariats Cotonou",
      "formateurs liturgiques Bénin",
    ],
  },
} as const satisfies Record<string, PageSeoEntry>;
