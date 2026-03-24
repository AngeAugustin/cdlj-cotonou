// ────────────────────────────────────────────────────────────────────────────
// Source de vérité unique pour les 15 vicariats forains de l'Archidiocèse
// de Cotonou et leurs paroisses.
// ────────────────────────────────────────────────────────────────────────────

export interface Vicariat {
  id: string;        // Numéro romain
  slug: string;
  name: string;      // Nom court
  fullName: string;  // Intitulé officiel complet
  zone: string;
  paroisses: number; // Nb officiel de paroisses (hors CC)
  lecteurs: number;  // Estimation membres CDLJ
  color: string;     // Classes Tailwind gradient (hero, carte)
  light: string;     // Classes Tailwind badge (liste)
  hexColor: string;  // Couleur hex (SVG schématique)
  // Positions SVG — viewBox "0 0 920 490"
  x: number;
  y: number;
  isHub?: boolean;
}

export const VICARIATS: Vicariat[] = [
  {
    id: "I",    slug: "notre-dame-cotonou",     name: "Notre-Dame Cotonou",
    fullName:   "Vicariat Forain Notre-Dame Cotonou",
    zone: "Cotonou Centre",     paroisses: 10, lecteurs: 1450,
    color: "from-amber-500 to-amber-700",   light: "bg-amber-50 text-amber-800 border-amber-200",
    hexColor: "#b45309", x: 598, y: 356, isHub: true,
  },
  {
    id: "II",   slug: "sacre-coeur",             name: "Sacré-Cœur",
    fullName:   "Vicariat Forain Sacré-Cœur",
    zone: "Cotonou Est",        paroisses: 10, lecteurs: 1280,
    color: "from-blue-500 to-blue-700",     light: "bg-blue-50 text-blue-800 border-blue-200",
    hexColor: "#1d4ed8", x: 672, y: 340,
  },
  {
    id: "III",  slug: "bon-pasteur",             name: "Bon Pasteur",
    fullName:   "Vicariat Forain Bon Pasteur",
    zone: "Cotonou Ouest",      paroisses: 10, lecteurs: 1180,
    color: "from-emerald-500 to-emerald-700", light: "bg-emerald-50 text-emerald-800 border-emerald-200",
    hexColor: "#047857", x: 515, y: 356,
  },
  {
    id: "IV",   slug: "ste-therese-godomey",     name: "Ste Thérèse Godomey",
    fullName:   "Vicariat Forain Sainte Thérèse Godomey",
    zone: "Godomey",            paroisses: 10, lecteurs: 1050,
    color: "from-rose-500 to-rose-700",     light: "bg-rose-50 text-rose-800 border-rose-200",
    hexColor: "#be123c", x: 445, y: 295,
  },
  {
    id: "V",    slug: "st-michel-togoudo",       name: "St Michel Togoudo",
    fullName:   "Vicariat Forain Saint Michel Togoudo",
    zone: "Togoudo",            paroisses: 7,  lecteurs: 720,
    color: "from-purple-500 to-purple-700", light: "bg-purple-50 text-purple-800 border-purple-200",
    hexColor: "#7e22ce", x: 342, y: 218,
  },
  {
    id: "VI",   slug: "st-antoine-calavi",       name: "St Antoine Calavi",
    fullName:   "Vicariat Forain Saint Antoine de Padoue Calavi",
    zone: "Abomey-Calavi",      paroisses: 10, lecteurs: 1350,
    color: "from-orange-500 to-orange-700", light: "bg-orange-50 text-orange-800 border-orange-200",
    hexColor: "#c2410c", x: 392, y: 258,
  },
  {
    id: "VII",  slug: "saint-luc-ouedo",         name: "Saint Luc Ouédo",
    fullName:   "Vicariat Forain Saint Luc Ouédo",
    zone: "Ouédo",              paroisses: 8,  lecteurs: 820,
    color: "from-teal-500 to-teal-700",     light: "bg-teal-50 text-teal-800 border-teal-200",
    hexColor: "#0f766e", x: 298, y: 178,
  },
  {
    id: "VIII", slug: "saint-jean-zinvie",       name: "Saint Jean Zinvié",
    fullName:   "Vicariat Forain Saint Jean l'Évangéliste Zinvié",
    zone: "Zinvié",             paroisses: 10, lecteurs: 940,
    color: "from-indigo-500 to-indigo-700", light: "bg-indigo-50 text-indigo-800 border-indigo-200",
    hexColor: "#3730a3", x: 418, y: 148,
  },
  {
    id: "IX",   slug: "saint-joseph-glo-yekon",  name: "St Joseph Glo-Yékon",
    fullName:   "Vicariat Forain Saint Joseph de Glo-Yékon",
    zone: "Glo-Djigbé",         paroisses: 9,  lecteurs: 780,
    color: "from-green-500 to-green-700",   light: "bg-green-50 text-green-800 border-green-200",
    hexColor: "#15803d", x: 555, y: 143,
  },
  {
    id: "X",    slug: "notre-dame-lac-nokoue",   name: "N-D Lac Nokoué",
    fullName:   "Vicariat Forain Notre-Dame de l'Immaculée Conception du Lac Nokoué",
    zone: "Lac Nokoué / Sô-Ava", paroisses: 5, lecteurs: 450,
    color: "from-cyan-500 to-cyan-700",     light: "bg-cyan-50 text-cyan-800 border-cyan-200",
    hexColor: "#0e7490", x: 718, y: 252,
  },
  {
    id: "XI",   slug: "sainte-jeanne-arc-allada", name: "Ste Jeanne d'Arc Allada",
    fullName:   "Vicariat Forain Sainte Jeanne d'Arc d'Allada",
    zone: "Allada",             paroisses: 10, lecteurs: 860,
    color: "from-pink-500 to-pink-700",     light: "bg-pink-50 text-pink-800 border-pink-200",
    hexColor: "#be185d", x: 248, y: 140,
  },
  {
    id: "XII",  slug: "saint-antoine-houegbo",   name: "St Antoine Houégbo",
    fullName:   "Vicariat Forain Saint Antoine de Padoue de Houégbo",
    zone: "Toffo / Houégbo",    paroisses: 7,  lecteurs: 580,
    color: "from-violet-500 to-violet-700", light: "bg-violet-50 text-violet-800 border-violet-200",
    hexColor: "#6d28d9", x: 165, y: 262,
  },
  {
    id: "XIII", slug: "sainte-genevieve-pahou",  name: "Ste Geneviève Pahou",
    fullName:   "Vicariat Forain Sainte Geneviève de Pahou",
    zone: "Pahou",              paroisses: 6,  lecteurs: 490,
    color: "from-lime-500 to-lime-700",     light: "bg-lime-50 text-lime-800 border-lime-200",
    hexColor: "#4d7c0f", x: 390, y: 402,
  },
  {
    id: "XIV",  slug: "notre-dame-ouidah",       name: "N-D Ouidah",
    fullName:   "Vicariat Forain Notre-Dame de l'Immaculée Conception Ouidah",
    zone: "Ouidah",             paroisses: 7,  lecteurs: 650,
    color: "from-sky-500 to-sky-700",       light: "bg-sky-50 text-sky-800 border-sky-200",
    hexColor: "#0369a1", x: 228, y: 408,
  },
  {
    id: "XV",   slug: "saint-antoine-lac-aheme", name: "St Antoine Lac Ahémé",
    fullName:   "Vicariat Forain Saint Antoine de Padoue du Lac Ahémé",
    zone: "Lac Ahémé",          paroisses: 5,  lecteurs: 380,
    color: "from-red-500 to-red-700",       light: "bg-red-50 text-red-800 border-red-200",
    hexColor: "#b91c1c", x: 112, y: 422,
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Détails par slug (données enrichies pour la page de détail)
// ────────────────────────────────────────────────────────────────────────────

export interface VicariatDetail {
  description: string;
  founded: string;
  localisation: string;
  adresse: string;
  lat: number;
  lon: number;
  paroissesList: string[];
  communautesList?: string[];
  equipe: { initials: string; name: string; role: string; gradient: string }[];
}

export const VICARIATS_DETAILS: Record<string, VicariatDetail> = {

  "notre-dame-cotonou": {
    description: "Le Vicariat Forain Notre-Dame de Cotonou est le cœur historique et spirituel de l'Archidiocèse. Centré autour de la Cathédrale Notre-Dame de Miséricorde, il rassemble dix paroisses emblématiques au cœur de la ville de Cotonou, animant une vie liturgique et pastorale intense.",
    founded: "1928", localisation: "Centre de Cotonou",
    adresse: "Cathédrale Notre-Dame de Miséricorde, Cotonou", lat: 6.3676, lon: 2.4189,
    paroissesList: [
      "Cathédrale Notre-Dame de Miséricorde", "Saint Michel", "Saint Jean-Baptiste",
      "Sainte Cécile", "Sainte Rita", "Saint Antoine de Padoue ZOGBO",
      "Sainte Famille DJIDJE", "Sainte Marie Mère du Sauveur MIDEDJI",
      "N-D de la Visitation", "Saint Joseph VOSSA",
    ],
    equipe: [
      { initials: "PA", name: "Fr Paul ADANNOU",  role: "Vicaire Forain",       gradient: "from-amber-400 to-amber-600"  },
      { initials: "MK", name: "Fr Marc KOSSOU",   role: "Secrétaire Vicarial",  gradient: "from-blue-400 to-blue-600"    },
      { initials: "RH", name: "Sr Rose HOUNNOU",  role: "Trésorière Vicariale", gradient: "from-emerald-400 to-emerald-600"},
      { initials: "JA", name: "Fr Jules AGOSSOU", role: "Resp. Formation",      gradient: "from-purple-400 to-purple-600"},
    ],
  },

  "sacre-coeur": {
    description: "Le Vicariat Forain Sacré-Cœur couvre les quartiers est de Cotonou, d'Akpakpa à Yénadjro. Avec dix paroisses actives, il constitue l'un des vicariats les plus dynamiques de l'archidiocèse, fort d'une jeunesse engagée dans la lecture et la mission.",
    founded: "1968", localisation: "Akpakpa, Cotonou",
    adresse: "Paroisse Sacré-Cœur, Quartier Akpakpa, Cotonou", lat: 6.3580, lon: 2.4480,
    paroissesList: [
      "Sacré-Cœur", "Saint Martin", "Sainte Thérèse de l'Enfant-Jésus PK6",
      "Saint Joseph AGBATO", "Sainte Trinité AVOTROU", "Saint Augustin COTONOU",
      "Saints Pierre et Paul YENAWA", "Christ-Roi AKPAKPA-DODOME",
      "Saint Mathieu KPONDEHOU", "Saint Antoine de Padoue TANTO",
    ],
    equipe: [
      { initials: "ET", name: "Fr Edmond TOSSA",   role: "Vicaire Forain",       gradient: "from-blue-400 to-blue-600"    },
      { initials: "CB", name: "Fr Clément BIAOU",  role: "Secrétaire Vicarial",  gradient: "from-sky-400 to-sky-600"      },
      { initials: "AH", name: "Sr Alice HOUETO",   role: "Trésorière Vicariale", gradient: "from-teal-400 to-teal-600"    },
      { initials: "GN", name: "Fr Gilles NOUDEKA", role: "Resp. Formation",      gradient: "from-indigo-400 to-indigo-600"},
    ],
  },

  "bon-pasteur": {
    description: "Le Vicariat Forain Bon Pasteur s'étend sur les quartiers de Cadjehoun, Fidjrossè et Agla. Il regroupe dix paroisses et une communauté chrétienne dans une zone en pleine expansion urbaine, portée par une pastorale des jeunes particulièrement dynamique.",
    founded: "1978", localisation: "Cadjehoun / Fidjrossè, Cotonou",
    adresse: "Paroisse Bon Pasteur, Cadjehoun, Cotonou", lat: 6.3700, lon: 2.3850,
    paroissesList: [
      "Bon Pasteur CADJEHOUN", "Sts Pierre et Paul AGLA – KOUHOUNOU",
      "Jésus Eucharistie de VEDOKO", "Saint Louis de GBEDEGBE",
      "Saint François d'Assise FIDJROSSE", "Saint Charles Lwanga AGLA-AKPLOMEY",
      "Sainte Famille AGLA-AKOGBATO", "Sainte Trinité AGLA-HLAZOUNTO",
      "Marie Auxiliatrice MENONTIN", "Saint Jean Bosco SETOVI",
    ],
    communautesList: ["Communauté Chrétienne de DJEBOU"],
    equipe: [
      { initials: "VS", name: "Fr Victor SOSSA",   role: "Vicaire Forain",       gradient: "from-emerald-400 to-emerald-600"},
      { initials: "TA", name: "Fr Thomas ADJOVI",  role: "Secrétaire Vicarial",  gradient: "from-green-400 to-green-600"   },
      { initials: "MG", name: "Sr Marie GANGBE",   role: "Trésorière Vicariale", gradient: "from-lime-400 to-lime-600"     },
      { initials: "BO", name: "Fr Bruno OGOUMA",   role: "Resp. Formation",      gradient: "from-teal-400 to-teal-600"     },
    ],
  },

  "ste-therese-godomey": {
    description: "Le Vicariat Forain Sainte Thérèse de Godomey couvre la zone de Godomey jusqu'à Togbin et Cocotomey. Il rassemble dix paroisses et une communauté chrétienne dans cette commune à forte croissance démographique, aux portes de Cotonou.",
    founded: "1985", localisation: "Godomey, Abomey-Calavi",
    adresse: "Paroisse Sainte Thérèse, Godomey, Abomey-Calavi", lat: 6.3930, lon: 2.3640,
    paroissesList: [
      "Sainte Thérèse GODOMEY", "Notre-Dame de Charité GODOMEY GARE",
      "Sainte Claire TOGBIN DAHO", "Saint Joseph DEKOUNGBE",
      "Saint Jean-Eudes ATROKPOCODJI", "Sainte Jeanne d'Arc LOBOZOUNKPA",
      "Saint Pio COCOTOMEY", "Saint Antoine de Padoue COCOTOMEY",
      "Saint Joseph GBODJE", "Saint Gabriel COCOCODJI",
    ],
    communautesList: ["Communauté Chrétienne TOGBIN DENOU"],
    equipe: [
      { initials: "AM", name: "Fr Aimé MEDENOU",   role: "Vicaire Forain",       gradient: "from-rose-400 to-rose-600"    },
      { initials: "FD", name: "Fr Félix DOSSOU",   role: "Secrétaire Vicarial",  gradient: "from-pink-400 to-pink-600"    },
      { initials: "BH", name: "Sr Berthe HOUNSOU", role: "Trésorière Vicariale", gradient: "from-fuchsia-400 to-fuchsia-600"},
      { initials: "KA", name: "Fr Karl AGBESSI",   role: "Resp. Formation",      gradient: "from-rose-400 to-rose-600"    },
    ],
  },

  "st-michel-togoudo": {
    description: "Le Vicariat Forain Saint Michel de Togoudo s'étend sur les localités de Togoudo, Tankpè et leurs environs. Il regroupe sept paroisses et une communauté chrétienne dans une zone semi-rurale en développement pastoral.",
    founded: "1992", localisation: "Togoudo, Abomey-Calavi",
    adresse: "Paroisse Saint Michel, Togoudo", lat: 6.4200, lon: 2.3500,
    paroissesList: [
      "Saint Michel TOGOUDO", "Sainte Famille TANKPE", "Saint Benoît WOMEY",
      "Saint Daniel COMBONI SODO", "Saint Luc YENADJRO",
      "Saint Michel HOUETO", "Sainte Thérèse d'Avila GANKON",
    ],
    communautesList: ["Communauté Chrétienne Immaculée Conception DJADJO"],
    equipe: [
      { initials: "OA", name: "Fr Olivier ADECHI", role: "Vicaire Forain",       gradient: "from-purple-400 to-purple-600"},
      { initials: "CD", name: "Fr Côme DJOSSOU",   role: "Secrétaire Vicarial",  gradient: "from-violet-400 to-violet-600"},
      { initials: "LK", name: "Sr Laure KIKI",     role: "Trésorière Vicariale", gradient: "from-purple-400 to-purple-600"},
      { initials: "HN", name: "Fr Henri NOUDEKA",  role: "Resp. Formation",      gradient: "from-indigo-400 to-indigo-600"},
    ],
  },

  "st-antoine-calavi": {
    description: "Le Vicariat Forain Saint Antoine de Padoue de Calavi couvre la commune d'Abomey-Calavi, l'une des zones à plus forte croissance de l'archidiocèse. Il rassemble dix paroisses et trois communautés chrétiennes, desservant un territoire en pleine expansion.",
    founded: "1995", localisation: "Abomey-Calavi",
    adresse: "Paroisse Saint Antoine de Padoue, Abomey-Calavi", lat: 6.4480, lon: 2.3450,
    paroissesList: [
      "Saint Antoine de Padoue CALAVI", "Sainte Joséphine BAKHITA CALAVI",
      "Saint Paul de ZOGBADJE", "Saint Albert Le Grand AÏTCHEDJI",
      "Saint Michel CALAVI GBODJO", "Sainte Trinité CALAVI ZOPAH",
      "Notre-Dame de l'Immaculée Conception AKASSATO", "Saint Jean Apôtre OUEGA",
      "Sainte Thérèse ADJAGBO", "Saint Pierre TOKAN",
    ],
    communautesList: [
      "Communauté Chrétienne St Gérard Magellan AHOSSOUGBETA",
      "Communauté Chrétienne KANSOUNKPA",
      "Communauté Chrétienne d'ATADJE",
    ],
    equipe: [
      { initials: "DA", name: "Fr David AMOUSSOU", role: "Vicaire Forain",       gradient: "from-orange-400 to-orange-600"},
      { initials: "PK", name: "Fr Pierre KPOSSOU", role: "Secrétaire Vicarial",  gradient: "from-amber-400 to-amber-600"  },
      { initials: "EG", name: "Sr Élise GANDONOU", role: "Trésorière Vicariale", gradient: "from-yellow-400 to-yellow-600" },
      { initials: "SH", name: "Fr Simon HOUNGUE",  role: "Resp. Formation",      gradient: "from-orange-400 to-orange-600"},
    ],
  },

  "saint-luc-ouedo": {
    description: "Le Vicariat Forain Saint Luc d'Ouédo s'étend sur les paroisses d'Ouédo, Hévié et leurs environs. Il regroupe huit paroisses desservant des communautés rurales et semi-rurales à la foi profondément enracinée.",
    founded: "2000", localisation: "Ouédo, Abomey-Calavi",
    adresse: "Paroisse Saint Luc, Ouédo", lat: 6.4650, lon: 2.3300,
    paroissesList: [
      "Saint Luc OUEDO", "Sainte Bernadette HEVIE DODJI",
      "Saint Michel Archange HEVIE HOUINME", "Saint Isidore de HEVIE-ADOVIE",
      "Saint Pierre Claver DJEGANTO", "Notre Dame des Douleurs AMIGONIEN-COME",
      "Notre-Dame de l'Assomption SOME", "Saint Martin OUEDO ADJAGBO",
    ],
    equipe: [
      { initials: "NG", name: "Fr Noël GNANVO",      role: "Vicaire Forain",       gradient: "from-teal-400 to-teal-600"    },
      { initials: "BK", name: "Fr Basile KPATCHAVI", role: "Secrétaire Vicarial",  gradient: "from-cyan-400 to-cyan-600"    },
      { initials: "FT", name: "Sr Flora TOUNKARA",   role: "Trésorière Vicariale", gradient: "from-teal-400 to-teal-600"    },
      { initials: "AO", name: "Fr Amédée OGOUMA",   role: "Resp. Formation",      gradient: "from-emerald-400 to-emerald-600"},
    ],
  },

  "saint-jean-zinvie": {
    description: "Le Vicariat Forain Saint Jean l'Évangéliste de Zinvié couvre la commune de Zinvié et ses localités environnantes. Il rassemble dix paroisses dans un territoire principalement rural, où la foi chrétienne s'exprime avec authenticité.",
    founded: "2003", localisation: "Zinvié, Département de l'Atlantique",
    adresse: "Paroisse Saint Jean l'Évangéliste, Zinvié", lat: 6.5500, lon: 2.4000,
    paroissesList: [
      "Saint Jean l'Évangéliste ZINVIE", "Saint Michel ZE",
      "Saint Joseph HEKANME", "St Jean Marie Vianney WAWATA",
      "Sainte Thérèse Enfant-Jésus AÏFA", "St Pierre Claver KOUNDOKPOE",
      "Rosa Mystica de WAWATA-ZOUNTO", "Saint Jean-Baptiste SEDJE DENOU",
      "St Jean de la Croix KPODJI-LES-MONTS", "Saint Dorothée ADJAN",
    ],
    equipe: [
      { initials: "IA", name: "Fr Ignace AZONNOU",  role: "Vicaire Forain",       gradient: "from-indigo-400 to-indigo-600"},
      { initials: "RD", name: "Fr René DOSSOU",     role: "Secrétaire Vicarial",  gradient: "from-blue-400 to-blue-600"    },
      { initials: "CH", name: "Sr Claire HOUSSOU",  role: "Trésorière Vicariale", gradient: "from-sky-400 to-sky-600"      },
      { initials: "MN", name: "Fr Maurice NOUDEKA", role: "Resp. Formation",      gradient: "from-violet-400 to-violet-600"},
    ],
  },

  "saint-joseph-glo-yekon": {
    description: "Le Vicariat Forain Saint Joseph de Glo-Yékon couvre la commune de Glo-Djigbé et ses environs. Avec neuf paroisses, il dessert les communautés rurales du nord de l'archidiocèse, portées par une pastorale missionnaire dynamique.",
    founded: "2005", localisation: "Glo-Djigbé, Département de l'Atlantique",
    adresse: "Paroisse Saint Joseph, Glo-Yékon", lat: 6.5800, lon: 2.4700,
    paroissesList: [
      "Saint Michel AGBODJEDO", "Saint Paul TANGBO-DJEVIE",
      "Saints Pierre et Paul DJIGBE AGA", "Saint Joseph GLO YEKON",
      "Saint Etienne AGONGBE", "Sainte Bernadette Soubirous AGONME",
      "Sainte Cécile DOMEGBO", "Sainte Rita GBETAGBO",
      "Notre-Dame du Rosaire AGASSA GODOMEY",
    ],
    equipe: [
      { initials: "JT", name: "Fr Jean TCHITCHI",   role: "Vicaire Forain",       gradient: "from-green-400 to-green-600"  },
      { initials: "SA", name: "Fr Sébastien AHEKE", role: "Secrétaire Vicarial",  gradient: "from-emerald-400 to-emerald-600"},
      { initials: "BG", name: "Sr Brigitte GBENOU", role: "Trésorière Vicariale", gradient: "from-lime-400 to-lime-600"    },
      { initials: "CH", name: "Fr Constant HOUETO", role: "Resp. Formation",      gradient: "from-green-400 to-green-600"  },
    ],
  },

  "notre-dame-lac-nokoue": {
    description: "Le Vicariat Forain Notre-Dame du Lac Nokoué s'étend sur les communautés riveraines et lacustres, incluant la célèbre cité lacustre de Ganvié. Ses cinq paroisses desservent des populations aux traditions uniques, vivant en symbiose avec le lac.",
    founded: "1958", localisation: "Lac Nokoué / Sô-Ava",
    adresse: "Paroisse Notre-Dame de l'Immaculée Conception, Sô-Tchanhoué", lat: 6.4800, lon: 2.5200,
    paroissesList: [
      "Notre-Dame de l'Immaculée Conception SO-TCHANHOUE", "Saint Ambroise LOKPO",
      "Saints Pierre et Paul GANVIE", "Saint Antoine de Padoue DEKANMEY",
      "Sainte Bernadette Soubirous SÔ-AVA",
    ],
    equipe: [
      { initials: "PH", name: "Fr Philippe HOUNYE",  role: "Vicaire Forain",       gradient: "from-cyan-400 to-cyan-600"    },
      { initials: "AM", name: "Fr André MIKPONHOUE", role: "Secrétaire Vicarial",  gradient: "from-sky-400 to-sky-600"      },
      { initials: "JG", name: "Sr Josette GANTIN",   role: "Trésorière Vicariale", gradient: "from-cyan-400 to-cyan-600"    },
      { initials: "BN", name: "Fr Benoît NONVIDE",   role: "Resp. Formation",      gradient: "from-blue-400 to-blue-600"    },
    ],
  },

  "sainte-jeanne-arc-allada": {
    description: "Le Vicariat Forain Sainte Jeanne d'Arc d'Allada couvre la commune d'Allada et ses environs. Avec dix paroisses, il rayonne dans une région à forte tradition catholique, au cœur du pays Fon, héritière d'une longue histoire missionnaire.",
    founded: "1935", localisation: "Allada, Département de l'Atlantique",
    adresse: "Paroisse Sainte Jeanne d'Arc, Allada", lat: 6.6600, lon: 2.1600,
    paroissesList: [
      "Sainte Jeanne d'Arc ALLADA", "St Jean-Baptiste TORI-BOSSITO",
      "Saint Mathieu TORI-CADA", "Saint Etienne GLOTOMEY",
      "Saint Christophe ATTOGON", "N-D de l'Immaculée Conception TORI-GARE",
      "Saint Joseph AZOHOUE CADA", "Saint Christophe SEKOU",
      "N-D de l'Immaculée Conception AYOU", "Transfiguration ALLADA DOGOUDO",
    ],
    equipe: [
      { initials: "MP", name: "Fr Martin PADONOU",   role: "Vicaire Forain",       gradient: "from-pink-400 to-pink-600"    },
      { initials: "LC", name: "Fr Luc COMLAN",       role: "Secrétaire Vicarial",  gradient: "from-rose-400 to-rose-600"    },
      { initials: "AK", name: "Sr Agnès KPOMAHOU",   role: "Trésorière Vicariale", gradient: "from-fuchsia-400 to-fuchsia-600"},
      { initials: "JB", name: "Fr Joseph BOSSOU",    role: "Resp. Formation",      gradient: "from-pink-400 to-pink-600"    },
    ],
  },

  "saint-antoine-houegbo": {
    description: "Le Vicariat Forain Saint Antoine de Padoue de Houégbo couvre les communes de Toffo et Houégbo. Il regroupe sept paroisses dans une zone rurale de l'archidiocèse, où la foi catholique s'enracine profondément dans les communautés villageoises.",
    founded: "1942", localisation: "Toffo / Houégbo",
    adresse: "Paroisse Saint Antoine de Padoue, Houégbo", lat: 6.5300, lon: 2.0800,
    paroissesList: [
      "Saint Antoine de Padoue HOUEGBO", "Saint Benoît TOFFO",
      "Sacré-Cœur SEHOUE", "Sacré-Cœur SEY-COUFFO",
      "Saint Cyprien DESSAH", "Sainte Anne AGON",
      "Notre-Dame de l'Assomption HINVI",
    ],
    equipe: [
      { initials: "EK", name: "Fr Emmanuel KPOVO",  role: "Vicaire Forain",       gradient: "from-violet-400 to-violet-600"},
      { initials: "AD", name: "Fr Alain DEGUENON",  role: "Secrétaire Vicarial",  gradient: "from-purple-400 to-purple-600"},
      { initials: "CM", name: "Sr Christine MEVO",  role: "Trésorière Vicariale", gradient: "from-violet-400 to-violet-600"},
      { initials: "FY", name: "Fr Firmin YEKPE",    role: "Resp. Formation",      gradient: "from-indigo-400 to-indigo-600"},
    ],
  },

  "sainte-genevieve-pahou": {
    description: "Le Vicariat Forain Sainte Geneviève de Pahou couvre les localités de Pahou, Ahozon et leurs environs. Ses six paroisses forment un pont pastoral entre Cotonou et Ouidah, desservant des communautés côtières et rurales attachées à leur foi.",
    founded: "1955", localisation: "Pahou, Commune de Ouidah",
    adresse: "Paroisse Sainte Geneviève, Pahou", lat: 6.3800, lon: 2.2200,
    paroissesList: [
      "Sainte Geneviève PAHOU", "Saint Antoine de Padoue AHOZON",
      "Saint Jude Thaddée ZOUNGOUDO", "Sainte Famille KPOVIE",
      "Saint Paul ADJARRA ADOVIE", "Saint Grégoire le Grand AKADJAMEY",
    ],
    equipe: [
      { initials: "CV", name: "Fr Cyrille VIDEGLA",  role: "Vicaire Forain",       gradient: "from-lime-400 to-lime-600"    },
      { initials: "AZ", name: "Fr Alexis ZANNOU",    role: "Secrétaire Vicarial",  gradient: "from-green-400 to-green-600"  },
      { initials: "DM", name: "Sr Dorothée MIDAHO",  role: "Trésorière Vicariale", gradient: "from-lime-400 to-lime-600"    },
      { initials: "GH", name: "Fr Grégoire HOTON",   role: "Resp. Formation",      gradient: "from-emerald-400 to-emerald-600"},
    ],
  },

  "notre-dame-ouidah": {
    description: "Le Vicariat Forain Notre-Dame de l'Immaculée Conception d'Ouidah couvre la commune d'Ouidah, ville historique à la croisée des cultures. La Basilique Notre-Dame de l'Immaculée Conception, l'une des plus anciennes de l'Afrique de l'Ouest, en est le joyau pastoral.",
    founded: "1680", localisation: "Ouidah, Département de l'Atlantique",
    adresse: "Basilique Notre-Dame de l'Immaculée Conception, Ouidah", lat: 6.3650, lon: 2.0850,
    paroissesList: [
      "Basilique Notre Dame de l'Immaculée Conception OUIDAH",
      "Saint Paul de TOVE OUIDAH", "Saint Jean GBENA",
      "Sacré-Cœur de SAVI", "Sacré-Cœur GBENA",
      "Saint Martin de Tours GBEZOUNME", "Épiphanie OUESSE-SEGBANOU",
    ],
    equipe: [
      { initials: "TA", name: "Fr Théodore AHOUNOU", role: "Vicaire Forain",       gradient: "from-sky-400 to-sky-600"      },
      { initials: "JD", name: "Fr Jérôme DAKO",      role: "Secrétaire Vicarial",  gradient: "from-blue-400 to-blue-600"    },
      { initials: "MS", name: "Sr Marguerite SOSSOU",role: "Trésorière Vicariale", gradient: "from-sky-400 to-sky-600"      },
      { initials: "FC", name: "Fr Fulgence CODJIA",  role: "Resp. Formation",      gradient: "from-cyan-400 to-cyan-600"    },
    ],
  },

  "saint-antoine-lac-aheme": {
    description: "Le Vicariat Forain Saint Antoine de Padoue du Lac Ahémé s'étend sur les rives du Lac Ahémé, aux confins occidentaux de l'archidiocèse. Ses cinq paroisses desservent des communautés de pêcheurs et d'agriculteurs dans un cadre naturel préservé.",
    founded: "1965", localisation: "Lac Ahémé, Commune de Bopa",
    adresse: "Paroisse Saint Antoine de Padoue, Ségbohoué", lat: 6.3900, lon: 1.9500,
    paroissesList: [
      "Saint Antoine de Padoue SEGBOHOUE",
      "Ste Catherine de Sienne TOKPA DOME",
      "Ste Marie Madeleine DEKANMEY",
      "Sainte Trinité ATCHAKANMEY",
      "Saint François d'Assise AGBANTO",
    ],
    equipe: [
      { initials: "PG", name: "Fr Pascal GANGBE",   role: "Vicaire Forain",       gradient: "from-red-400 to-red-600"      },
      { initials: "LD", name: "Fr Lazare DOSSOU",   role: "Secrétaire Vicarial",  gradient: "from-rose-400 to-rose-600"    },
      { initials: "HK", name: "Sr Hélène KPAKPA",   role: "Trésorière Vicariale", gradient: "from-red-400 to-red-600"      },
      { initials: "AL", name: "Fr Aristide LOKO",   role: "Resp. Formation",      gradient: "from-orange-400 to-orange-600"},
    ],
  },
};
