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
        codes: ["130050101", "130050102"],
        title: "Centre-ville et Beaumond",
        description:
          "Autour du centre ancien et de Beaumond, la proximité des commerces, l’accès, le stationnement et l’état du bâti peuvent créer des écarts sensibles d’une rue à l’autre.",
      },
      {
        codes: ["130050501", "130050502"],
        title: "La Tourtelle",
        description:
          "À La Tourtelle, l’environnement immédiat, l’exposition, les extérieurs et la facilité de stationnement comptent autant que la surface affichée du logement.",
      },
      {
        codes: ["130050403", "130050603"],
        title: "Charrel et Camp Major",
        description:
          "Dans les secteurs du Charrel et de Camp Major, la typologie du bien, son état, ses accès et sa proximité avec les services doivent être comparés avec des ventes réellement voisines.",
      },
      {
        codes: ["130050703"],
        title: "Saint-Mitre",
        description:
          "À Saint-Mitre, terrain, orientation, qualité du bâti, calme et stationnement peuvent différencier fortement deux maisons pourtant proches sur la carte.",
      },
      {
        codes: ["130050201", "130050301"],
        title: "Les Passons et Pin Vert",
        description:
          "Aux Passons comme au Pin Vert, nous replaçons le logement dans son environnement précis avant de comparer ses prestations, ses extérieurs et son niveau de travaux.",
      },
      {
        codes: ["130050702"],
        title: "Garlaban et Royante",
        description:
          "Aux abords du Garlaban et de Royante, le relief, les vues, la parcelle, les accès et l’exposition deviennent essentiels pour apprécier la valeur d’une propriété.",
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
        title: "Village central",
        description:
          "Au cœur de Gémenos, le charme du bâti ancien s’apprécie rue par rue. L’état du bien, la luminosité, les extérieurs, l’accès et les possibilités de stationnement peuvent créer de vrais écarts de valeur.",
      },
      {
        title: "Petit Versailles",
        description:
          "Situé sur les hauteurs, le Petit Versailles se distingue par ses jardins et son cadre résidentiel. L’exposition, l’ensoleillement, la vue et la qualité du bâti y jouent un rôle important dans l’estimation.",
      },
      {
        codes: ["130420101"],
        title: "Ouest-La Plaine",
        description:
          "Dans cette partie de Gémenos, la surface du terrain, l’environnement immédiat et la facilité d’accès comptent particulièrement. Une maison doit être comparée avec des ventes réellement proches et présentant des caractéristiques similaires.",
      },
      {
        codes: ["130420102"],
        title: "Est de Gémenos",
        description:
          "À l’est de Gémenos, le relief, le cadre paysager, l’exposition et les accès créent des situations très différentes. L’analyse de l’adresse et une visite du bien restent indispensables pour déterminer un prix cohérent.",
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
        codes: ["130280101", "130280102"],
        title: "Centre-ville et Vieux-Port",
        description:
          "Dans le centre et autour du Vieux-Port, l’état du bâti, l’étage, la luminosité, les nuisances, l’accès et le stationnement font varier la valeur d’une adresse à l’autre.",
      },
      {
        codes: ["130280103"],
        title: "Calanques et Le Mugel",
        description:
          "Du côté des Calanques et du Mugel, la vue, l’exposition, la proximité du littoral, les extérieurs et les conditions d’accès demandent une comparaison particulièrement localisée.",
      },
      {
        codes: ["130280107"],
        title: "Peymian et Clos des Plages",
        description:
          "À Peymian et au Clos des Plages, la distance réelle au bord de mer, le calme, le stationnement et la qualité des espaces extérieurs comptent fortement dans l’attractivité du bien.",
      },
      {
        codes: ["130280111"],
        title: "Fontsainte et Saint-Jean",
        description:
          "Dans les secteurs de Fontsainte et Saint-Jean, orientation, aperçu mer, environnement immédiat, accès et caractéristiques de la résidence doivent être étudiés au cas par cas.",
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
        codes: ["130220101"],
        title: "Centre ancien et port",
        description:
          "Dans le centre ancien et autour du port, charme, état du bâti, étage, luminosité, accès et stationnement peuvent produire des écarts importants sur quelques rues.",
      },
      {
        codes: ["130220102"],
        title: "Le Bestouan",
        description:
          "Au Bestouan, la proximité de la plage ne suffit pas à fixer un prix : vue, exposition, extérieur, accès, stationnement et qualité du bâti restent déterminants.",
      },
      {
        codes: ["130220103"],
        title: "Presqu’île et Port-Miou",
        description:
          "Sur la Presqu’île et vers Port-Miou, l’ouverture sur le paysage, le calme, la parcelle et les contraintes propres à l’adresse doivent être confrontés à des ventes très comparables.",
      },
      {
        codes: ["130220104"],
        title: "Revestel et Les Janots",
        description:
          "Du Revestel aux Janots, relief, vues, orientation, accès et configuration du terrain créent des situations immobilières très différentes au sein d’un même secteur.",
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
        codes: ["130010101", "130010102", "130010104", "130010105"],
        title: "Centre historique et Mazarin",
        description:
          "Dans le centre historique et le quartier Mazarin, adresse, étage, ascenseur, luminosité, état du bâti et possibilités de stationnement expliquent une grande partie des écarts de valeur.",
      },
      {
        codes: ["130010304", "130010401", "130010402"],
        title: "La Torse et Val Saint-André",
        description:
          "À La Torse et au Val Saint-André, environnement, résidence, extérieur, exposition, accès au centre et stationnement doivent être comparés à une échelle très locale.",
      },
      {
        codes: ["130010701", "130010702", "130010703", "130010704", "130010705", "130010706"],
        title: "Jas de Bouffan",
        description:
          "Au Jas de Bouffan, la résidence, les travaux, l’étage, les charges, les espaces extérieurs et les services à proximité permettent d’affiner le prix au-delà de la moyenne du quartier.",
      },
      {
        codes: ["130010801", "130010802", "130010803", "130010804"],
        title: "Puyricard et Couteron",
        description:
          "Sur le plateau de Puyricard et vers Couteron, terrain, qualité du bâti, environnement, vues, dépendances et temps d’accès à Aix deviennent essentiels pour comparer les maisons.",
      },
      {
        codes: ["130010905", "130010906", "130010907", "130010908"],
        title: "Les Milles et La Duranne",
        description:
          "Aux Milles et à La Duranne, typologie du logement, date de construction, extérieur, stationnement, accès et proximité des pôles d’activité structurent la comparaison.",
      },
      {
        codes: ["130010901", "130010903"],
        title: "Luynes et Pont de l’Arc",
        description:
          "À Luynes et au Pont de l’Arc, l’environnement immédiat, la parcelle, les accès, les établissements voisins et les prestations du bien créent des marchés distincts.",
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
        codes: ["831120101"],
        title: "Centre du village",
        description:
          "Dans le centre du village, proximité des commerces, état du bâti, extérieur, accès et stationnement permettent de distinguer des biens pourtant situés à quelques rues seulement.",
      },
      {
        codes: ["831120103"],
        title: "Les Lecques",
        description:
          "Aux Lecques, la distance réelle à la plage, la vue, l’exposition, le calme, les extérieurs et la place de stationnement comptent particulièrement dans l’estimation.",
      },
      {
        codes: ["831120102"],
        title: "La Madrague",
        description:
          "Autour du port de La Madrague, environnement maritime, accès, vue, relief et caractéristiques du bâti doivent être comparés avec des ventes situées dans un périmètre proche.",
      },
      {
        codes: ["831120102"],
        title: "Port d’Alon et Frégate",
        description:
          "Vers Port d’Alon et Frégate, parcelle, paysage, exposition, accès et prestations de la propriété prennent une importance particulière dans la détermination de la valeur.",
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
