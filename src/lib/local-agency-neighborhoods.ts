export type LocalAgencyNeighborhood = {
  codes?: string[];
  description: string;
  title: string;
};

export type LocalAgencyNeighborhoodProfile = {
  neighborhoods: LocalAgencyNeighborhood[];
  sources: Array<{
    href: string;
    label: string;
  }>;
};

const localAgencyNeighborhoodProfiles: Record<string, LocalAgencyNeighborhoodProfile> = {
  aubagne: {
    neighborhoods: [
      {
        codes: ["130050702"],
        title: "Garlaban et Royante",
        description:
          "Aux abords du Garlaban et de Royante, les maisons dominent largement. Vue, exposition, qualité de la parcelle, accès et intégration dans le paysage deviennent essentiels pour apprécier la valeur d’une propriété.",
      },
      {
        codes: ["130050701"],
        title: "Arnaud-Solans",
        description:
          "Arnaud-Solans présente un tissu très largement composé de maisons. La surface du terrain, le calme, les vues, les dépendances et la facilité d’accès doivent être comparés avec des propriétés réellement proches.",
      },
      {
        codes: ["130050601"],
        title: "Longuillar",
        description:
          "À Longuillar, le parc résidentiel est principalement constitué de maisons. Parcelle, orientation, environnement immédiat, niveau de rénovation et prestations extérieures structurent la comparaison.",
      },
      {
        codes: ["130050602"],
        title: "Pérussone",
        description:
          "À Pérussone, la présence importante de maisons invite à raisonner au-delà du prix moyen communal. Terrain, état du bâti, exposition, stationnement et qualité des extérieurs font la différence.",
      },
      {
        codes: ["130050401"],
        title: "Les Gavots",
        description:
          "Dans le secteur des Gavots, les maisons et leurs terrains occupent une place importante. L’accès, le relief, l’exposition, les vues et le potentiel du bâti demandent une lecture à l’échelle de l’adresse.",
      },
      {
        codes: ["130050705"],
        title: "Baudinard",
        description:
          "À Baudinard, le parc est très majoritairement composé de maisons. La superficie utile de la parcelle, le calme, les accès, les dépendances et les prestations doivent être confrontés à des ventes comparables.",
      },
    ],
    sources: [
      {
        href: "https://www.aubagne.fr/actualite/aubagne-au-coeur-de-la-vie-des-quartiers/",
        label: "Ville d’Aubagne",
      },
    ],
  },
  gemenos: {
    neighborhoods: [
      {
        codes: ["130420102"],
        title: "Petit Versailles et les hauteurs",
        description:
          "Le Petit Versailles et les hauteurs s’inscrivent dans la partie est de Gémenos, où les maisons sont très présentes. Ensoleillement, vue, jardin, accès et qualité du bâti y orientent fortement l’estimation.",
      },
      {
        codes: ["130420101"],
        title: "Les Craux et Le Coupier",
        description:
          "À l’ouest, Les Craux et Le Coupier appartiennent au paysage résidentiel de la Plaine. Terrain, accès, environnement immédiat et qualité des extérieurs doivent être comparés avec des maisons proches.",
      },
      {
        codes: ["130420102"],
        title: "Coulin et Les Nègles",
        description:
          "Au sud-est de Gémenos, Coulin et Les Nègles regroupent un habitat plus diffus. Relief, calme, orientation, parcelle et conditions d’accès peuvent différencier fortement deux propriétés voisines.",
      },
      {
        codes: ["130420101"],
        title: "Saint-Jean-de-Garguier",
        description:
          "Vers Saint-Jean-de-Garguier, les maisons s’inscrivent dans un environnement plus rural et paysager. Parcelle, dépendances, accès, assainissement et état général nécessitent une analyse sur place.",
      },
    ],
    sources: [
      {
        href: "https://plui.ampmetropole.fr/plui/Marseille",
        label: "PLUi Marseille Provence",
      },
    ],
  },
  "la-ciotat": {
    neighborhoods: [
      {
        codes: ["130280107"],
        title: "Peymian et Clos des Plages",
        description:
          "Peymian et le Clos des Plages comptent parmi les secteurs résidentiels à examiner pour une maison. Distance au littoral, terrain, calme, exposition et stationnement restent déterminants.",
      },
      {
        codes: ["130280111"],
        title: "Fontsainte et Saint-Jean",
        description:
          "À l’est, Fontsainte et Saint-Jean associent secteurs résidentiels, maisons et proximité du littoral. Vue, exposition, accès, qualité des extérieurs et environnement immédiat doivent être étudiés séparément.",
      },
      {
        codes: ["130280104"],
        title: "Les Crêtes",
        description:
          "Les Crêtes se distinguent par une présence importante de maisons. Relief, dégagement, exposition, parcelle et facilité d’accès jouent un rôle central pour comparer deux biens situés dans ce secteur.",
      },
      {
        codes: ["130280103"],
        title: "Calanques et Le Mugel",
        description:
          "Du côté des Calanques et du Mugel, les données INSEE montrent que près d’un logement sur deux est une maison. Vue, extérieur, contraintes d’accès et proximité du littoral imposent une comparaison très locale.",
      },
    ],
    sources: [
      {
        href: "https://plui.ampmetropole.fr/assets/documents/PLUi_CT1_I_PADD.pdf",
        label: "PLUi Marseille Provence",
      },
    ],
  },
  cassis: {
    neighborhoods: [
      {
        codes: ["130220104"],
        title: "Revestel, Les Janots et Sainte-Croix",
        description:
          "La périphérie résidentielle, du Revestel aux Janots et à Sainte-Croix, est la partie de Cassis où les maisons sont les plus présentes selon l’INSEE. Terrain, vues et accès y sont essentiels.",
      },
      {
        codes: ["130220104"],
        title: "Brigadan et Grande Bastide",
        description:
          "Vers le Brigadan et la Grande Bastide, les propriétés se comparent selon la parcelle, les vues, l’exposition, les accès et les prestations. La visite reste indispensable pour apprécier ces écarts.",
      },
      {
        codes: ["130220103"],
        title: "Presqu’île et Port-Miou",
        description:
          "Sur la Presqu’île et vers Port-Miou, l’ouverture sur le paysage, le calme, la parcelle et les contraintes propres à l’adresse doivent être confrontés à des ventes de maisons très comparables.",
      },
      {
        codes: ["130220102"],
        title: "Bestouan et Petite Couronne",
        description:
          "Au Bestouan et dans la Petite Couronne, la proximité du littoral ne suffit pas à fixer un prix. Vue, exposition, extérieur, stationnement et qualité du bâti restent déterminants.",
      },
    ],
    sources: [
      {
        href: "https://www.cassis.fr/actualites/collecte-des-dechets-du-renfort-des-le-1er-mai",
        label: "Ville de Cassis",
      },
    ],
  },
  "aix-en-provence": {
    neighborhoods: [
      {
        codes: ["130010804"],
        title: "Sud-Ouest du plateau de Puyricard",
        description:
          "Le sud-ouest du plateau de Puyricard présente un parc presque entièrement composé de maisons. Terrain, vues, dépendances, environnement et qualité du bâti y sont décisifs.",
      },
      {
        codes: ["130010801", "130010802", "130010803"],
        title: "Plateau nord et village de Puyricard",
        description:
          "Du plateau nord au village de Puyricard, les maisons occupent une place dominante. Parcelle, environnement, exposition, dépendances et temps d’accès à Aix structurent la comparaison.",
      },
      {
        codes: ["130010404"],
        title: "Campagne Repentance",
        description:
          "Campagne Repentance présente un parc largement pavillonnaire dans un environnement recherché. Calme, terrain, végétation, accès, dépendances et état du bâti guident l’estimation.",
      },
      {
        codes: ["130010902"],
        title: "Montaiguet",
        description:
          "Au Montaiguet, la majorité du parc est constituée de maisons. Relief, environnement naturel, accès, surface du terrain et contraintes propres à la parcelle créent des écarts importants.",
      },
      {
        codes: ["130010707", "130010710"],
        title: "Les Granettes et Campagne Ouest",
        description:
          "Des Granettes à Campagne Ouest, le paysage résidentiel mêle maisons, grands terrains et poches de campagne. Accès, vues, potentiel et niveau de prestations doivent être analysés adresse par adresse.",
      },
      {
        codes: ["130010903"],
        title: "Luynes village",
        description:
          "À Luynes, plus d’un logement sur deux est une maison. L’environnement immédiat, la parcelle, les accès vers Aix et Marseille, les nuisances éventuelles et les prestations créent des marchés distincts.",
      },
    ],
    sources: [
      {
        href: "https://www.aixenprovence.fr/Vie-des-quartiers-et-villages-2023",
        label: "Ville d’Aix-en-Provence",
      },
    ],
  },
  "saint-cyr-sur-mer": {
    neighborhoods: [
      {
        codes: ["831120102"],
        title: "Frégate et Port d’Alon",
        description:
          "De Frégate à Port d’Alon, l’environnement paysager et la présence de maisons placent la parcelle, les vues, l’exposition, les accès et les prestations au cœur de l’estimation.",
      },
      {
        codes: ["831120103"],
        title: "Les Lecques, Banette et Pradeaux",
        description:
          "Des Lecques à Banette et aux Pradeaux, les maisons sont très présentes parmi les résidences principales. Distance à la plage, vue, calme, extérieur et stationnement comptent particulièrement.",
      },
      {
        codes: ["831120102"],
        title: "La Madrague et Rampale",
        description:
          "Autour de La Madrague et vers Rampale, environnement maritime, accès, vue, relief et caractéristiques du bâti doivent être comparés avec des ventes de maisons situées dans un périmètre proche.",
      },
      {
        codes: ["831120101"],
        title: "Cagueloup et Gueissard",
        description:
          "À Cagueloup et Gueissard, la présence de maisons et la proximité du village créent un marché différent du littoral. Terrain, calme, accès, travaux et qualité des extérieurs doivent être pondérés.",
      },
    ],
    sources: [
      {
        href: "https://www.saintcyrsurmer.com/incontournables/les-lieux-emblematiques/",
        label: "Office de tourisme de Saint-Cyr-sur-Mer",
      },
    ],
  },
};

export function getLocalAgencyNeighborhoodProfile(citySlug: string) {
  return localAgencyNeighborhoodProfiles[citySlug] ?? null;
}

export const LOCAL_AGENCY_NEIGHBORHOOD_PREVIEW_SLUGS = Object.freeze(
  Object.keys(localAgencyNeighborhoodProfiles),
);
