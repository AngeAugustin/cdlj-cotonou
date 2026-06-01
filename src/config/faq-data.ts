/** Questions fréquentes — source unique pour l'UI et le schéma FAQPage JSON-LD. */
import { PAROISHES_TOTAL, VICARIATS_TOTAL } from "@/config/community-stats";

export const FAQ_ITEMS = [
  {
    q: "Qu'est-ce que la CDLJ ?",
    a: "La Communauté Diocésaine des Lecteurs Juniors (CDLJ) rassemble les jeunes lecteurs au service de l'Enfance Missionnaire de Cotonou. Elle forme, accompagne et fédère les lecteurs de l'Archidiocèse autour de la proclamation de la Parole de Dieu lors des célébrations et activités paroissiales.",
  },
  {
    q: "Comment est organisée la communauté dans l'archidiocèse ?",
    a: `L'Archidiocèse de Cotonou est structuré en ${VICARIATS_TOTAL} vicariats forains regroupant ${PAROISHES_TOTAL} paroisses. Chaque lecteur est rattaché à une paroisse et à un vicariat, ce qui permet une organisation claire entre la vie locale, la coordination vicariale et l'animation diocésaine.`,
  },
  {
    q: "Quel est le rôle d'un vicariat ?",
    a: "Le vicariat forain est une zone pastorale qui coordonne plusieurs paroisses voisines. Il sert de relais entre l'administration diocésaine et les communautés locales : animation des lecteurs, organisation d'activités interparoissiales et suivi de la vie de la CDLJ à l'échelle du vicariat forain.",
  },
  {
    q: "Quelles activités la CDLJ propose-t-elle aux lecteurs ?",
    a: "Tout au long de l'année, la communauté organise des formations liturgiques, des retraites, des célébrations diocésaines, des sessions diocésaines, des weekends de formations et d'autres activités spirituelles et éducatives. Les paroisses et vicariats proposent également leurs propres activités ouvertes aux lecteurs de leur ressort.",
  },
  {
    q: "Comment un lecteur progresse-t-il dans la communauté ?",
    a: "Chaque lecteur est inscrit avec un grade qui reflète son niveau de formation et de responsabilité liturgique. Des évaluations périodiques permettent de mesurer sa progression et, le cas échéant, de le promouvoir au grade supérieur après validation par les responsables concernés.",
  },
  {
    q: "Comment retrouver ma paroisse ou mon vicariat sur le site ?",
    a: `Rendez-vous sur la page « Nos vicariats » pour découvrir la carte des ${VICARIATS_TOTAL} vicariats forains, leurs paroisses affiliées et leurs coordonnées. Vous y trouverez aussi les informations utiles pour contacter les responsables de votre secteur.`,
  },
] as const;
