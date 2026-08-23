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

const INSEE_IRIS_SOURCE = {
  href: "https://www.insee.fr/fr/metadonnees/definition/c1523",
  label: "zonage IRIS de l’INSEE",
};

const PLUI_PAYS_AUBAGNE_SOURCE = {
  href: "https://plui.ampmetropole.fr/plui/aubagne",
  label: "PLUi du Pays d’Aubagne et de l’Étoile",
};

const localAgencyNeighborhoodProfiles: Record<string, LocalAgencyNeighborhoodProfile> = {
  aubagne: {
    neighborhoods: [
      {
        codes: ["130050702"],
        title: "Garlaban-Royante",
        description:
          "Aux abords du Garlaban et de Royante, les maisons dominent largement. Vue, exposition, qualité de la parcelle, accès et intégration dans le paysage deviennent essentiels pour apprécier la valeur d’une propriété.",
      },
      {
        codes: ["130050701"],
        title: "Arnaud Solans",
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
        title: "Gavots",
        description:
          "Dans le secteur des Gavots, les maisons et leurs terrains occupent une place importante. L’accès, le relief, l’exposition, les vues et le potentiel du bâti demandent une lecture à l’échelle de l’adresse.",
      },
      {
        codes: ["130050705"],
        title: "Beaudinard",
        description:
          "À Beaudinard, le parc est très majoritairement composé de maisons. La superficie utile de la parcelle, le calme, les accès, les dépendances et les prestations doivent être confrontés à des ventes comparables.",
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
    sources: [PLUI_PAYS_AUBAGNE_SOURCE],
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
        title: "Les Calanques et Le Mugel",
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
        title: "Le Revestel, Les Janots et Sainte-Croix",
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
        title: "Le Bestouan et la Petite Couronne",
        description:
          "Au Bestouan et dans la Petite Couronne, la proximité du littoral ne suffit pas à fixer un prix. Vue, exposition, extérieur, stationnement et qualité du bâti restent déterminants.",
      },
    ],
    sources: [
      {
        href: "https://plui.ampmetropole.fr/plui/Marseille",
        label: "PLUi Marseille Provence",
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
        title: "Plateau de Puyricard et village",
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
  ceyreste: {
    neighborhoods: [
      {
        title: "Le village et ses abords",
        description:
          "Autour du noyau villageois, l’âge du bâti, la configuration des rues, le stationnement et la qualité des rénovations peuvent créer des écarts sensibles entre deux maisons proches.",
      },
      {
        title: "Mauregard",
        description:
          "Dans le quartier de Mauregard, terrain, exposition, calme, accès et proximité des espaces naturels sont à rapprocher de ventes de maisons réellement comparables.",
      },
      {
        title: "Les Olivettes et la Voie Romaine",
        description:
          "Vers les Olivettes et la Voie Romaine, la parcelle, le relief, les vues, les dépendances et les conditions d’accès pèsent davantage qu’un simple prix moyen communal.",
      },
    ],
    sources: [
      {
        href: "https://www.ceyreste.fr/p-l-u-i",
        label: "PLUi de Ceyreste",
      },
    ],
  },
  "roquefort-la-bedoule": {
    neighborhoods: [
      {
        title: "Roquefort",
        description:
          "Le hameau historique de Roquefort et ses abords présentent un environnement plus rural. Terrain, accès, exposition, dépendances et contraintes du bâti doivent y être examinés sur place.",
      },
      {
        title: "La Bédoule",
        description:
          "Autour de La Bédoule, la proximité des commerces et des axes, le calme de la rue, le stationnement, l’état du bien et la qualité des extérieurs structurent la comparaison.",
      },
      {
        title: "Le Pas d’Ouillier",
        description:
          "Vers le Pas d’Ouillier, les propriétés demandent une lecture attentive de la parcelle, du relief, des accès, de l’environnement naturel et des éventuelles nuisances.",
      },
    ],
    sources: [
      {
        href: "https://www.roquefort-labedoule.fr/fr/village/histoire",
        label: "Ville de Roquefort-la-Bédoule",
      },
    ],
  },
  "la-cadiere-d-azur": {
    neighborhoods: [
      {
        title: "Le village perché",
        description:
          "Dans le village perché, le caractère du bâti, les vues, les accès, le stationnement et la qualité d’une rénovation doivent être appréciés adresse par adresse.",
      },
      {
        title: "Saint-Côme et Saint-Jean",
        description:
          "Dans les vallons de Saint-Côme et Saint-Jean, parcelle, environnement viticole, exposition, calme et temps d’accès au littoral peuvent fortement différencier deux propriétés.",
      },
      {
        title: "Les collines sud",
        description:
          "Sur les collines sud, le relief, les vues, l’orientation, les accès et la qualité des aménagements extérieurs deviennent des critères essentiels pour comparer les maisons.",
      },
    ],
    sources: [
      {
        href: "https://lacadieredazur.fr/wp-content/uploads/2015/02/plu27_diagnostic_panneaux_alleges.pdf",
        label: "PLU de La Cadière-d’Azur",
      },
    ],
  },
  "le-castellet": {
    neighborhoods: [
      {
        title: "Le Castellet Village",
        description:
          "Dans le village perché, la valeur tient au caractère du bâti, à son état, aux vues, aux accès et aux contraintes patrimoniales autant qu’à la surface habitable.",
      },
      {
        title: "Le Brûlat et Sainte-Anne",
        description:
          "Le Brûlat et Sainte-Anne associent noyaux de hameaux et extensions pavillonnaires. Terrain, calme, proximité des services et niveau de prestations y orientent la comparaison.",
      },
      {
        title: "Le Plan et Le Camp",
        description:
          "Du Plan au Camp, l’environnement, la taille de la parcelle, l’accessibilité, les dépendances et les nuisances éventuelles doivent être vérifiés avant toute estimation.",
      },
    ],
    sources: [
      {
        href: "https://www.ville-lecastellet.fr/guide-des-demarches/demarches-durbanisme/plan-local-durbanisme-plu/",
        label: "PLU du Castellet",
      },
    ],
  },
  bandol: {
    neighborhoods: [
      {
        codes: ["830090106"],
        title: "Bandol Nord",
        description:
          "Au nord de Bandol, les maisons sont davantage présentes parmi les résidences principales. Parcelle, calme, vues, accès et distance au centre doivent être comparés localement.",
      },
      {
        codes: ["830090101"],
        title: "Bandol Sud-Ouest",
        description:
          "Dans le sud-ouest, la proximité du littoral ne suffit pas à fixer un prix. Vue, exposition, extérieur, stationnement, état du bâti et environnement immédiat restent déterminants.",
      },
    ],
    sources: [INSEE_IRIS_SOURCE],
  },
  "le-beausset": {
    neighborhoods: [
      {
        codes: ["830160103"],
        title: "Les Quatre Frères, Les Cancades et Les Ginestes",
        description:
          "Dans ce vaste secteur résidentiel, les maisons dominent très largement. Terrain, environnement naturel, accès, dépendances et qualité du bâti structurent l’estimation.",
      },
      {
        codes: ["830160102"],
        title: "Le Rouve, Gailleux et le Val d’Arenc",
        description:
          "Du Rouve au Val d’Arenc, le parc est principalement composé de maisons. Relief, parcelle, calme, exposition et proximité des axes doivent être pondérés à l’échelle de l’adresse.",
      },
    ],
    sources: [INSEE_IRIS_SOURCE],
  },
  "sanary-sur-mer": {
    neighborhoods: [
      {
        codes: ["831230106"],
        title: "Beaucours, La Gorguette et La Morvenède",
        description:
          "De Beaucours à La Morvenède, les maisons occupent une place importante. Distance au littoral, vue, terrain, calme, accès et stationnement doivent être comparés avec précision.",
      },
      {
        codes: ["831230108"],
        title: "Sanary Nord",
        description:
          "Au nord de Sanary, le parc est très majoritairement composé de maisons. Parcelle, orientation, environnement, facilité d’accès et qualité des extérieurs font varier la valeur.",
      },
    ],
    sources: [INSEE_IRIS_SOURCE],
  },
  evenos: {
    neighborhoods: [
      {
        title: "Sainte-Anne d’Évenos",
        description:
          "À Sainte-Anne, la proximité des services et des axes, le calme de l’adresse, la parcelle, le stationnement et l’état du bien sont à confronter à des ventes proches.",
      },
      {
        title: "Le Broussan",
        description:
          "Au Broussan, l’environnement plus rural place le terrain, les accès, les dépendances, l’assainissement et l’état général au cœur de l’estimation.",
      },
      {
        title: "Nèbre et le Vieil Évenos",
        description:
          "Autour de Nèbre et du vieux village, relief, vues, caractère du bâti, contraintes d’accès et qualité d’une rénovation rendent chaque propriété particulière.",
      },
    ],
    sources: [
      {
        href: "https://www.evenos.fr/-A-la-decouverte-du-village-et-de-ses-3-hameaux-",
        label: "Ville d’Évenos",
      },
    ],
  },
  ollioules: {
    neighborhoods: [
      {
        codes: ["830900102"],
        title: "Ollioules Nord-Est",
        description:
          "Au nord-est d’Ollioules, les maisons dominent largement le parc. Terrain, vues, environnement, accès et niveau de rénovation doivent être comparés entre propriétés proches.",
      },
      {
        codes: ["830900104"],
        title: "Ollioules Ouest",
        description:
          "À l’ouest, la forte présence de maisons invite à examiner la parcelle, l’orientation, le calme, les dépendances et la facilité d’accès au-delà de la moyenne communale.",
      },
    ],
    sources: [INSEE_IRIS_SOURCE],
  },
  signes: {
    neighborhoods: [
      {
        title: "Le village et ses abords",
        description:
          "Autour du village, la configuration de la rue, l’état du bâti, le stationnement, la proximité des services et les extérieurs doivent être lus à l’échelle de l’adresse.",
      },
      {
        title: "Danjean et Bois Soleil",
        description:
          "Dans les secteurs de Danjean et Bois Soleil, terrain, calme, exposition, accès et contraintes naturelles peuvent différencier sensiblement deux maisons de surface comparable.",
      },
      {
        title: "Saint-Clair et La Limatte",
        description:
          "Vers Saint-Clair et La Limatte, la qualité de la parcelle, l’environnement, l’accessibilité et les dépendances prennent une place centrale dans l’analyse d’une propriété.",
      },
    ],
    sources: [
      {
        href: "https://www.geoportail-urbanisme.gouv.fr/document/by-id/4d6b70db367615c96168d2ed3c64597b",
        label: "PLU de Signes sur le Géoportail de l’urbanisme",
      },
    ],
  },
  "six-fours-les-plages": {
    neighborhoods: [
      {
        codes: ["831290102"],
        title: "Talian",
        description:
          "À Talian, les maisons sont très largement majoritaires. Parcelle, calme, exposition, accès et qualité des extérieurs doivent être comparés avec des biens du même secteur.",
      },
      {
        codes: ["831290303"],
        title: "Le Fort",
        description:
          "Dans le secteur du Fort, la présence importante de maisons place le terrain, l’environnement immédiat, l’orientation et les prestations au cœur de l’estimation.",
      },
      {
        codes: ["831290304"],
        title: "Les Playes",
        description:
          "Aux Playes, l’habitat individuel est très présent. Accès, nuisances éventuelles, parcelle, stationnement et état du bâti doivent être pondérés rue par rue.",
      },
      {
        codes: ["831290203"],
        title: "Le Brusc",
        description:
          "Au Brusc, la proximité du littoral, la vue, le calme, les extérieurs et le stationnement créent des écarts que la moyenne de Six-Fours ne peut pas résumer.",
      },
    ],
    sources: [INSEE_IRIS_SOURCE],
  },
  "la-seyne-sur-mer": {
    neighborhoods: [
      {
        codes: ["831260403"],
        title: "Jaumen",
        description:
          "À Jaumen, le parc est presque entièrement composé de maisons. Terrain, environnement, calme, accès et prestations doivent être comparés avec des propriétés très proches.",
      },
      {
        codes: ["831260301"],
        title: "Janas, La Verne et Les Gabrielles",
        description:
          "De Janas à La Verne et aux Gabrielles, l’environnement naturel, la parcelle, les vues, l’orientation et l’accès jouent un rôle majeur pour estimer une maison.",
      },
      {
        codes: ["831260302"],
        title: "Coste Chaude et Mauvéou",
        description:
          "À Coste Chaude et Mauvéou, les maisons dominent largement. Relief, terrain, calme, stationnement et qualité du bâti structurent la comparaison locale.",
      },
      {
        codes: ["831260404"],
        title: "Donicarde et Barban",
        description:
          "Dans les secteurs de Donicarde et Barban, parcelle, environnement, accès, travaux et prestations extérieures peuvent expliquer des écarts importants entre deux biens voisins.",
      },
    ],
    sources: [INSEE_IRIS_SOURCE],
  },
  "carnoux-en-provence": {
    neighborhoods: [
      {
        codes: ["131190103"],
        title: "Carnoux Est",
        description:
          "À l’est de Carnoux, quatre logements sur cinq sont des maisons selon l’INSEE. Terrain, relief, exposition, accès et qualité des extérieurs structurent l’estimation.",
      },
      {
        codes: ["131190101"],
        title: "Carnoux Ouest",
        description:
          "À l’ouest, les maisons restent majoritaires. Parcelle, calme, proximité des axes, vue, stationnement et niveau de rénovation doivent être comparés localement.",
      },
    ],
    sources: [INSEE_IRIS_SOURCE],
  },
  auriol: {
    neighborhoods: [
      {
        codes: ["130070102"],
        title: "Auriol Nord-Est",
        description:
          "Au nord-est d’Auriol, les maisons représentent l’essentiel du parc. Terrain, environnement, accès, dépendances et état du bâti doivent être analysés adresse par adresse.",
      },
      {
        codes: ["130070103"],
        title: "Auriol Sud",
        description:
          "Au sud, l’habitat individuel est très présent. Relief, exposition, calme, parcelle, proximité des axes et qualité des extérieurs font varier la valeur.",
      },
    ],
    sources: [INSEE_IRIS_SOURCE, PLUI_PAYS_AUBAGNE_SOURCE],
  },
  "cuges-les-pins": {
    neighborhoods: [
      {
        title: "Le village et ses abords",
        description:
          "Autour du village, la rue, l’âge du bâti, le stationnement, les travaux et la proximité des services comptent autant que la surface pour comparer deux logements.",
      },
      {
        title: "Le sud du centre-ville",
        description:
          "Au sud du centre-ville, l’implantation de la maison, la parcelle, les accès, l’exposition et les nuisances éventuelles doivent être rapprochés de ventes locales.",
      },
      {
        title: "La plaine de Cuges",
        description:
          "Dans la plaine, terrain, environnement agricole, dépendances, assainissement, accès et contraintes naturelles imposent une lecture précise de chaque propriété.",
      },
    ],
    sources: [PLUI_PAYS_AUBAGNE_SOURCE],
  },
  "la-penne-sur-huveaune": {
    neighborhoods: [
      {
        codes: ["130700102"],
        title: "La Penne Sud",
        description:
          "Au sud de La Penne-sur-Huveaune, les maisons sont largement majoritaires. Relief, vues, accès, terrain et proximité des espaces naturels structurent l’estimation.",
      },
      {
        codes: ["130700103"],
        title: "Centre et nord de La Penne",
        description:
          "Du centre au nord, le parc reste majoritairement composé de maisons. Rue, accès, stationnement, parcelle et nuisances éventuelles doivent être comparés localement.",
      },
    ],
    sources: [INSEE_IRIS_SOURCE, PLUI_PAYS_AUBAGNE_SOURCE],
  },
  marseille: {
    neighborhoods: [
      {
        title: "Bompard et Le Roucas-Blanc",
        description:
          "Dans ces quartiers du 7e arrondissement, relief, vues, accès, stationnement, extérieurs et qualité du bâti créent des écarts importants d’une rue à l’autre.",
      },
      {
        title: "Montredon et Les Goudes",
        description:
          "Sur le littoral sud, vue, proximité de la mer, contraintes d’accès, exposition, extérieurs et stationnement doivent être analysés bien par bien.",
      },
      {
        title: "Les Accates, Les Camoins et Éoures",
        description:
          "Dans l’est marseillais, ces quartiers accueillent de nombreux secteurs de maisons. Terrain, calme, desserte, vues et qualité des prestations orientent fortement l’estimation.",
      },
      {
        title: "Saint-Barnabé et Montolivet",
        description:
          "À Saint-Barnabé et Montolivet, la proximité des commerces, la rue, le stationnement, les extérieurs et l’état du bien doivent être confrontés aux ventes du secteur.",
      },
    ],
    sources: [
      {
        href: "https://www.marseille.fr/sites/default/files/contenu/decouvrir-marseille/PDF/liste_des_111_quartiers.pdf",
        label: "liste officielle des 111 quartiers de Marseille",
      },
    ],
  },
  allauch: {
    neighborhoods: [
      {
        codes: ["130020106"],
        title: "Golf, Embus, Enco de Botte et Bellons",
        description:
          "Dans ce vaste secteur d’Allauch, près de neuf logements sur dix sont des maisons. Parcelle, relief, vues, accès et environnement naturel guident la comparaison.",
      },
      {
        codes: ["130020101"],
        title: "Le Logis Neuf Est",
        description:
          "À l’est du Logis Neuf, les maisons dominent très largement. Terrain, calme, orientation, proximité des services et niveau de rénovation structurent l’estimation.",
      },
    ],
    sources: [INSEE_IRIS_SOURCE],
  },
  gardanne: {
    neighborhoods: [
      {
        codes: ["130410107"],
        title: "Biver",
        description:
          "À Biver, les maisons occupent une place importante dans un secteur à l’identité minière marquée. Rue, terrain, travaux, nuisances éventuelles et proximité des services sont à pondérer.",
      },
      {
        codes: ["130410105"],
        title: "Gardanne Sud-Est",
        description:
          "Au sud-est, la part de maisons est plus forte que dans plusieurs secteurs centraux. Parcelle, accès, environnement, stationnement et état du bâti orientent la comparaison.",
      },
    ],
    sources: [
      {
        href: "https://www.ville-gardanne.fr/culture-et-tourisme/tourisme/patrimoine-et-balades/",
        label: "Ville de Gardanne",
      },
    ],
  },
  "bouc-bel-air": {
    neighborhoods: [
      {
        codes: ["130150105"],
        title: "Bouc-Bel-Air Nord",
        description:
          "Au nord de Bouc-Bel-Air, les maisons dominent largement. Terrain, environnement, accès vers Aix et Marseille, calme et qualité du bâti structurent l’estimation.",
      },
      {
        codes: ["130150102"],
        title: "La Salle",
        description:
          "À La Salle, plus de huit logements sur dix sont des maisons. Parcelle, proximité des équipements, circulation, extérieurs et prestations doivent être comparés localement.",
      },
    ],
    sources: [
      {
        href: "https://www.boucbelair.fr/decouvrir-bouc-bel-air/ville-nature/velos-mobilites-douces/les-travaux-a-la-loupe/",
        label: "Ville de Bouc-Bel-Air",
      },
    ],
  },
  roquevaire: {
    neighborhoods: [
      {
        codes: ["130860104"],
        title: "Lascours",
        description:
          "À Lascours, les maisons représentent la quasi-totalité du parc. Terrain, vues sur le Garlaban, accès, dépendances et état du bâti sont décisifs.",
      },
      {
        codes: ["130860103"],
        title: "Pont de l’Étoile",
        description:
          "Au Pont de l’Étoile, les maisons sont très présentes. Rue, parcelle, accès, proximité des axes, nuisances éventuelles et qualité des extérieurs doivent être pondérés.",
      },
    ],
    sources: [INSEE_IRIS_SOURCE, PLUI_PAYS_AUBAGNE_SOURCE],
  },
  "la-destrousse": {
    neighborhoods: [
      {
        title: "Le cœur de ville",
        description:
          "Dans le cœur de ville, la proximité des services, la circulation, le stationnement, l’état du bâti et la qualité des extérieurs doivent être comparés à l’échelle de la rue.",
      },
      {
        title: "Font de Branque",
        description:
          "Vers Font de Branque, parcelle, relief, environnement naturel, exposition et accès peuvent différencier sensiblement deux maisons pourtant proches.",
      },
      {
        title: "Souque Nègre et Malvésine",
        description:
          "Autour de Souque Nègre et Malvésine, la lecture du terrain, des accès, des nuisances éventuelles et des caractéristiques réelles du bien reste indispensable.",
      },
    ],
    sources: [PLUI_PAYS_AUBAGNE_SOURCE],
  },
  cadolive: {
    neighborhoods: [
      {
        title: "L’Ortolan et Le Pâté",
        description:
          "De l’Ortolan au Pâté, terrain, relief, environnement, accès et exposition doivent être rapprochés de ventes de maisons situées dans un périmètre proche.",
      },
      {
        title: "Chante-Coucou et La Reyne",
        description:
          "Sous le village, Chante-Coucou et La Reyne demandent une lecture précise de la parcelle, du calme, des vues, du stationnement et du niveau de rénovation.",
      },
      {
        title: "Saint-Joseph",
        description:
          "Au nord de Cadolive, Saint-Joseph se compare selon la parcelle, l’environnement, les accès, les contraintes de terrain et les prestations propres à chaque maison.",
      },
    ],
    sources: [
      {
        href: "https://www.mairie-cadolive.fr/presentation.aspx",
        label: "Ville de Cadolive",
      },
    ],
  },
  "saint-savournin": {
    neighborhoods: [
      {
        title: "Puits Germain",
        description:
          "À Puits Germain, la parcelle, l’environnement, les accès, les travaux et les contraintes liées au terrain doivent être intégrés à l’estimation.",
      },
      {
        title: "Le Château et l’entrée nord",
        description:
          "Vers Le Château et l’entrée nord, l’implantation de la maison, le relief, la parcelle, le calme et la proximité des services orientent la comparaison.",
      },
      {
        title: "L’Adrech et Maisons Neuves",
        description:
          "Dans les quartiers de l’Adrech et Maisons Neuves, exposition, accès, stationnement, terrain et qualité du bâti peuvent faire varier la valeur d’une rue à l’autre.",
      },
    ],
    sources: [PLUI_PAYS_AUBAGNE_SOURCE],
  },
  belcodene: {
    neighborhoods: [
      {
        title: "Le village et son entrée",
        description:
          "Autour du village, la configuration de la rue, la parcelle, les vues, le stationnement et l’état du bâti doivent être appréciés au-delà d’une moyenne communale.",
      },
      {
        title: "La Pomme et Albinos",
        description:
          "Dans les secteurs de La Pomme et Albinos, terrain, environnement naturel, accès, dépendances et contraintes propres à la parcelle sont essentiels pour comparer les maisons.",
      },
      {
        title: "Appailladou",
        description:
          "Vers Appailladou, la qualité de l’emplacement, l’exposition, le calme, les accès et le niveau de prestations demandent une analyse sur place.",
      },
    ],
    sources: [PLUI_PAYS_AUBAGNE_SOURCE],
  },
  mimet: {
    neighborhoods: [
      {
        title: "Le village et La Tour",
        description:
          "Autour du village et de La Tour, relief, vues, accès, caractère du bâti, terrain et qualité des rénovations structurent fortement la valeur.",
      },
      {
        title: "Les Moulières",
        description:
          "Aux Moulières, la rue, la parcelle, le calme, la proximité des services et le niveau de rénovation doivent être comparés avec des maisons du même secteur.",
      },
      {
        title: "Les Fabres et Château-Bas",
        description:
          "Dans les quartiers ouest, des Fabres à Château-Bas, terrain, environnement, accès, exposition et prestations extérieures orientent l’estimation.",
      },
    ],
    sources: [
      {
        href: "https://www.mimet.fr/",
        label: "Ville de Mimet",
      },
    ],
  },
  "simiane-collongue": {
    neighborhoods: [
      {
        codes: ["131070102"],
        title: "Le Hameau",
        description:
          "Dans l’IRIS du Hameau, les maisons dominent très largement. Parcelle, relief, environnement, vues, accès et niveau de prestations structurent l’estimation.",
      },
      {
        codes: ["131070101"],
        title: "Le secteur de la Gare",
        description:
          "Autour de la Gare, les maisons restent largement majoritaires. Rue, circulation, terrain, stationnement, accès et état du bâti doivent être comparés localement.",
      },
    ],
    sources: [INSEE_IRIS_SOURCE],
  },
  "la-bouilladisse": {
    neighborhoods: [
      {
        title: "Le Vieux Bouilladisse",
        description:
          "Autour du Vieux Bouilladisse, la rue, le caractère du bâti, les travaux, le stationnement et les extérieurs doivent être appréciés adresse par adresse.",
      },
      {
        title: "Les Gorguettes et La Gandole",
        description:
          "Dans les secteurs des Gorguettes et de La Gandole, parcelle, accès, environnement, calme et proximité des services structurent la comparaison entre maisons.",
      },
      {
        title: "Baume de Marron",
        description:
          "Vers Baume de Marron, relief, exposition, terrain, accès et qualité des aménagements extérieurs peuvent créer des écarts sensibles.",
      },
    ],
    sources: [PLUI_PAYS_AUBAGNE_SOURCE],
  },
  peypin: {
    neighborhoods: [
      {
        title: "Le Terme Nord",
        description:
          "Au Terme Nord, terrain, accès, environnement naturel, exposition et qualité du bâti doivent être rapprochés de ventes de maisons comparables.",
      },
      {
        title: "Vert Clos",
        description:
          "Dans le secteur de Vert Clos, parcelle, calme, proximité des services, stationnement et niveau de rénovation orientent la valeur d’une maison.",
      },
      {
        title: "L’Auberge Neuve et Bel-Air",
        description:
          "De l’Auberge Neuve à Bel-Air, la rue, les accès, les nuisances éventuelles, le terrain et les prestations doivent être examinés à l’échelle du bien.",
      },
    ],
    sources: [PLUI_PAYS_AUBAGNE_SOURCE],
  },
  "plan-de-cuques": {
    neighborhoods: [
      {
        codes: ["130750104"],
        title: "Plan-de-Cuques Ouest",
        description:
          "À l’ouest de Plan-de-Cuques, les maisons dominent très largement. Terrain, rue, calme, stationnement, accès et qualité des extérieurs guident l’estimation.",
      },
      {
        codes: ["130750102"],
        title: "Plan-de-Cuques Sud",
        description:
          "Au sud, l’habitat individuel reste majoritaire. Parcelle, relief, exposition, proximité des axes et niveau de rénovation doivent être comparés rue par rue.",
      },
    ],
    sources: [INSEE_IRIS_SOURCE],
  },
  toulon: {
    neighborhoods: [
      {
        codes: ["831370305"],
        title: "L’Oratoire",
        description:
          "À L’Oratoire, les maisons dominent très largement. Parcelle, relief, vues, accès, calme et qualité du bâti structurent la comparaison.",
      },
      {
        codes: ["831370405"],
        title: "Faron et Fort Blanc",
        description:
          "Sur les pentes du Faron et vers Fort Blanc, vues, relief, exposition, accès, stationnement et terrain font varier la valeur d’une adresse à l’autre.",
      },
      {
        codes: ["831370704"],
        title: "Darboussède et La Bosquette",
        description:
          "À Darboussède et La Bosquette, la présence importante de maisons invite à examiner parcelle, calme, accès, travaux et prestations extérieures.",
      },
      {
        codes: ["831370808"],
        title: "La Serinette et Le Cap Brun",
        description:
          "De La Serinette au Cap Brun, la rue, la proximité du littoral, la vue, les extérieurs, le stationnement et l’état du bien doivent être pondérés avec précision.",
      },
    ],
    sources: [INSEE_IRIS_SOURCE],
  },
  "la-valette-du-var": {
    neighborhoods: [
      {
        codes: ["831440107"],
        title: "La Valette Nord",
        description:
          "Au nord de La Valette, les maisons sont largement majoritaires. Terrain, relief, environnement, accès et qualité des extérieurs structurent l’estimation.",
      },
    ],
    sources: [INSEE_IRIS_SOURCE],
  },
  arles: {
    neighborhoods: [
      {
        codes: ["130040117"],
        title: "Trinquetaille Nord",
        description:
          "Au nord de Trinquetaille, les maisons dominent très largement. Terrain, rue, risque inondation, accès et état du bâti doivent être intégrés à la comparaison.",
      },
      {
        codes: ["130040119"],
        title: "Pont de Crau",
        description:
          "À Pont de Crau, l’habitat individuel est très présent. Parcelle, environnement, accès, dépendances et qualité des extérieurs structurent l’estimation.",
      },
      {
        codes: ["130040121"],
        title: "Moulès",
        description:
          "À Moulès, les maisons occupent l’essentiel du parc. Terrain, environnement rural, dépendances, accès et contraintes propres à la parcelle doivent être vérifiés.",
      },
      {
        codes: ["130040120"],
        title: "Raphèle",
        description:
          "À Raphèle, le parc est très majoritairement composé de maisons. Rue, parcelle, calme, accès et état du bâti orientent la comparaison locale.",
      },
    ],
    sources: [INSEE_IRIS_SOURCE],
  },
  hyeres: {
    neighborhoods: [
      {
        codes: ["830690122"],
        title: "L’Almanarre",
        description:
          "À L’Almanarre, les maisons sont très présentes. Proximité du littoral, terrain, exposition, vent, accès et qualité des extérieurs guident l’estimation.",
      },
      {
        codes: ["830690115"],
        title: "Costebelle et Mont des Oiseaux",
        description:
          "De Costebelle au Mont des Oiseaux, relief, vues, parcelle, orientation, accès et prestations peuvent créer des écarts importants entre propriétés.",
      },
      {
        codes: ["830690112"],
        title: "La Bayorre et Les Hautes Loubes",
        description:
          "À La Bayorre et aux Hautes Loubes, les maisons sont majoritaires. Terrain, environnement, desserte, calme et niveau de rénovation structurent la comparaison.",
      },
      {
        codes: ["830690118"],
        title: "Giens",
        description:
          "À Giens, la proximité de la mer, les vues, l’exposition, l’accès, le stationnement et les extérieurs doivent être comparés bien par bien.",
      },
    ],
    sources: [INSEE_IRIS_SOURCE],
  },
  frejus: {
    neighborhoods: [
      {
        codes: ["830610116"],
        title: "Tour de Mare",
        description:
          "À Tour de Mare, les maisons dominent largement. Terrain, environnement, accès, calme, piscine et qualité du bâti structurent l’estimation.",
      },
      {
        codes: ["830610115"],
        title: "Sainte-Brigitte",
        description:
          "À Sainte-Brigitte, le parc est majoritairement composé de maisons. Parcelle, exposition, desserte, nuisances éventuelles et prestations doivent être comparées localement.",
      },
      {
        codes: ["830610119"],
        title: "Secteurs extérieurs de Fréjus",
        description:
          "Dans les secteurs extérieurs de Fréjus, les maisons sont très présentes parmi les résidences principales. Terrain, accès et environnement deviennent décisifs.",
      },
      {
        codes: ["830610114"],
        title: "Saint-Aygulf",
        description:
          "À Saint-Aygulf, la proximité du littoral, la rue, les vues, les extérieurs, le stationnement et l’état du bien font varier la valeur au-delà de la moyenne communale.",
      },
    ],
    sources: [INSEE_IRIS_SOURCE],
  },
};

export function getLocalAgencyNeighborhoodProfile(citySlug: string) {
  return localAgencyNeighborhoodProfiles[citySlug] ?? null;
}

export const LOCAL_AGENCY_NEIGHBORHOOD_PREVIEW_SLUGS = Object.freeze(
  Object.keys(localAgencyNeighborhoodProfiles),
);
