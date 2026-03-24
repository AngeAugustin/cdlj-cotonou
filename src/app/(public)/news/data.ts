export interface NewsPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  body: string[];
  date: string;
  author: string;
  authorRole: string;
  category: string;
  readTime: string;
  image: string;
  featured: boolean;
}

export const NEWS_POSTS: NewsPost[] = [
  {
    id: 1,
    slug: "assemblee-generale-ordinaire-2026",
    title: "Assemblée Générale Ordinaire 2026",
    excerpt:
      "Tous les vicariats sont conviés à la présentation du bilan d'activités annuel de la communauté diocésaine. Les grandes lignes de l'année à venir y seront débattues.",
    body: [
      "La Communauté Diocésaine des Lecteurs Juniors (CDLJ) de Cotonou a le plaisir de convoquer l'ensemble de ses membres à l'Assemblée Générale Ordinaire 2026. Cet événement capital rassemblera les délégués de chacun des huit vicariats afin de faire le point sur l'exercice écoulé et de tracer les grandes orientations de l'année à venir.",
      "Au programme de cette journée : la présentation du rapport moral par le Secrétaire Général, suivie du rapport financier établi par le Trésorier Diocésain. Les participants auront l'occasion de poser leurs questions, d'émettre des observations et de voter les résolutions proposées par le Bureau Diocésain.",
      "Parmi les points phares à l'ordre du jour figurent la révision du règlement intérieur, l'adoption du budget prévisionnel 2026-2027, ainsi que l'examen des candidatures pour les postes vacants au sein du Bureau Exécutif. Un temps de prière et de fraternité clôturera la journée.",
      "La participation de chaque vicariat est obligatoire. Les responsables paroissiaux sont priés de désigner leurs délégués au plus tard deux semaines avant la date de l'assemblée et d'en informer leur bureau vicarial respectif via le portail intranet.",
      "La CDLJ rappelle que l'Assemblée Générale est le lieu souverain de décision de notre communauté. C'est un acte de responsabilité et de communion que d'y prendre part activement. Ensemble, construisons l'avenir de notre mission.",
    ],
    date: "12 Mars 2026",
    author: "Comité d'Organisation",
    authorRole: "Bureau Diocésain CDLJ",
    category: "Événement Annuel",
    readTime: "4 min de lecture",
    image:
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=1600",
    featured: true,
  },
  {
    id: 2,
    slug: "renovation-structure-vicariale",
    title: "Rénovation de la structure Vicariale",
    excerpt:
      "Découvrez les nouvelles directives concernant la classification des paroisses sous la tutelle du vicariat forain de la zone C.",
    body: [
      "Dans le cadre de la modernisation de son organisation territoriale, le Bureau Diocésain de la CDLJ a annoncé une réforme structurelle majeure concernant la répartition des paroisses au sein des vicariats. Cette réorganisation vise à rééquilibrer les charges administratives et pastorales entre les différentes zones géographiques du diocèse.",
      "La zone C, qui couvrait historiquement un nombre disproportionné de paroisses par rapport à ses ressources humaines disponibles, bénéficiera d'un redécoupage territorial. Trois paroisses seront rattachées à un nouveau vicariat satellite, permettant ainsi une supervision plus efficace et une meilleure réactivité sur le terrain.",
      "Cette révision s'accompagne d'une mise à jour du portail intranet, où la hiérarchie géographique reflètera désormais la nouvelle organisation. Les comptes utilisateurs affectés seront automatiquement migrés vers leur nouvelle structure de rattachement sans interruption de service.",
      "Les responsables concernés seront convoqués à une réunion de transition dès la semaine prochaine. Un guide pratique leur sera remis pour faciliter la prise en main des nouveaux paramètres sur la plateforme.",
    ],
    date: "5 Mars 2026",
    author: "Bureau Diocésain",
    authorRole: "Administration Diocésaine",
    category: "Décisions",
    readTime: "3 min de lecture",
    image:
      "https://images.unsplash.com/photo-1436450412740-6b988f486c6b?auto=format&fit=crop&q=80&w=1600",
    featured: false,
  },
  {
    id: 3,
    slug: "celebration-nouveaux-lecteurs",
    title: "Célébration des Nouveaux Lecteurs",
    excerpt:
      "Un événement festif en l'honneur des adhérents qui ont franchi le premier niveau d'apprentissage avec succès cette année.",
    body: [
      "La CDLJ a célébré avec fierté et joie la promotion 2026 de ses jeunes lecteurs juniors lors d'une cérémonie émouvante organisée dans l'enceinte de la cathédrale diocésaine. Pas moins de deux cent quatre-vingt-douze nouveaux membres ont officiellement rejoint le mouvement après avoir validé avec succès leur premier niveau de formation.",
      "La cérémonie s'est ouverte par une célébration eucharistique présidée par le Curé Diocésain, suivie d'une remise symbolique des insignes du lecteur à chaque nouveau membre. Parents, parrain et marraine spirituels étaient conviés à partager ce moment de grâce avec leurs jeunes.",
      "Le Président du Bureau Diocésain a pris la parole pour rappeler la vocation profonde du lecteur junior : être sel et lumière au cœur de la communauté, porter la Parole et l'incarner dans les actes du quotidien. Il a également rendu hommage aux formateurs bénévoles qui œuvrent sans relâche tout au long de l'année.",
      "La journée s'est poursuivie par des animations culturelles, des chants liturgiques et un repas fraternel réunissant l'ensemble des vicariats présents. Cet événement restera gravé dans la mémoire des nouvelles recrues comme le point de départ d'une belle aventure spirituelle et communautaire.",
    ],
    date: "28 Février 2026",
    author: "Presse Locale CDLJ",
    authorRole: "Service Communication",
    category: "Célébration",
    readTime: "4 min de lecture",
    image:
      "https://images.unsplash.com/photo-1543722530-d2c3201371e7?auto=format&fit=crop&q=80&w=1600",
    featured: false,
  },
];
