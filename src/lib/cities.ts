export type City = {
  slug: string;
  name: string;
  postalCode: string;
  inseeCode: string;
  department: string;
  region: string;
  latitude: number;
  longitude: number;
  nearbySlugs: string[];
};

export const southCities: City[] = [
  {
    slug: "aubagne",
    name: "Aubagne",
    postalCode: "13400",
    inseeCode: "13005",
    department: "Bouches-du-Rhone",
    region: "Provence-Alpes-Cote d'Azur",
    latitude: 43.2928,
    longitude: 5.5707,
    nearbySlugs: ["gemenos", "la-penne-sur-huveaune", "carnoux-en-provence", "auriol"],
  },
  {
    slug: "gemenos",
    name: "Gémenos",
    postalCode: "13420",
    inseeCode: "13042",
    department: "Bouches-du-Rhone",
    region: "Provence-Alpes-Cote d'Azur",
    latitude: 43.2989,
    longitude: 5.6284,
    nearbySlugs: ["aubagne", "cuges-les-pins", "auriol", "roquefort-la-bedoule"],
  },
  {
    slug: "ceyreste",
    name: "Ceyreste",
    postalCode: "13600",
    inseeCode: "13023",
    department: "Bouches-du-Rhone",
    region: "Provence-Alpes-Cote d'Azur",
    latitude: 43.2215,
    longitude: 5.6354,
    nearbySlugs: ["cassis", "saint-cyr-sur-mer", "cuges-les-pins", "roquefort-la-bedoule"],
  },
  {
    slug: "cassis",
    name: "Cassis",
    postalCode: "13260",
    inseeCode: "13022",
    department: "Bouches-du-Rhone",
    region: "Provence-Alpes-Cote d'Azur",
    latitude: 43.2185,
    longitude: 5.5503,
    nearbySlugs: ["carnoux-en-provence", "roquefort-la-bedoule", "ceyreste", "marseille"],
  },
  {
    slug: "roquefort-la-bedoule",
    name: "Roquefort-la-Bédoule",
    postalCode: "13830",
    inseeCode: "13085",
    department: "Bouches-du-Rhone",
    region: "Provence-Alpes-Cote d'Azur",
    latitude: 43.2518,
    longitude: 5.6297,
    nearbySlugs: ["carnoux-en-provence", "cassis", "ceyreste", "aubagne"],
  },
  {
    slug: "saint-cyr-sur-mer",
    name: "Saint-Cyr-sur-Mer",
    postalCode: "83270",
    inseeCode: "83112",
    department: "Var",
    region: "Provence-Alpes-Cote d'Azur",
    latitude: 43.17,
    longitude: 5.7055,
    nearbySlugs: ["bandol", "la-cadiere-d-azur", "le-castellet", "ceyreste"],
  },
  {
    slug: "la-cadiere-d-azur",
    name: "La Cadière-d’Azur",
    postalCode: "83740",
    inseeCode: "83027",
    department: "Var",
    region: "Provence-Alpes-Cote d'Azur",
    latitude: 43.2026,
    longitude: 5.7231,
    nearbySlugs: ["saint-cyr-sur-mer", "le-castellet", "bandol", "le-beausset"],
  },
  {
    slug: "le-castellet",
    name: "Le Castellet",
    postalCode: "83330",
    inseeCode: "83035",
    department: "Var",
    region: "Provence-Alpes-Cote d'Azur",
    latitude: 43.2148,
    longitude: 5.7561,
    nearbySlugs: ["la-cadiere-d-azur", "le-beausset", "evenos", "signes"],
  },
  {
    slug: "bandol",
    name: "Bandol",
    postalCode: "83150",
    inseeCode: "83009",
    department: "Var",
    region: "Provence-Alpes-Cote d'Azur",
    latitude: 43.147,
    longitude: 5.7488,
    nearbySlugs: ["sanary-sur-mer", "saint-cyr-sur-mer", "la-cadiere-d-azur", "le-beausset"],
  },
  {
    slug: "le-beausset",
    name: "Le Beausset",
    postalCode: "83330",
    inseeCode: "83016",
    department: "Var",
    region: "Provence-Alpes-Cote d'Azur",
    latitude: 43.205,
    longitude: 5.8239,
    nearbySlugs: ["le-castellet", "la-cadiere-d-azur", "evenos", "bandol"],
  },
  {
    slug: "sanary-sur-mer",
    name: "Sanary-sur-Mer",
    postalCode: "83110",
    inseeCode: "83123",
    department: "Var",
    region: "Provence-Alpes-Cote d'Azur",
    latitude: 43.1374,
    longitude: 5.7951,
    nearbySlugs: ["bandol", "six-fours-les-plages", "ollioules", "la-seyne-sur-mer"],
  },
  {
    slug: "evenos",
    name: "Évenos",
    postalCode: "83330",
    inseeCode: "83053",
    department: "Var",
    region: "Provence-Alpes-Cote d'Azur",
    latitude: 43.1876,
    longitude: 5.8702,
    nearbySlugs: ["le-beausset", "ollioules", "toulon", "signes"],
  },
  {
    slug: "ollioules",
    name: "Ollioules",
    postalCode: "83190",
    inseeCode: "83090",
    department: "Var",
    region: "Provence-Alpes-Cote d'Azur",
    latitude: 43.1385,
    longitude: 5.8515,
    nearbySlugs: ["sanary-sur-mer", "six-fours-les-plages", "toulon", "evenos"],
  },
  {
    slug: "signes",
    name: "Signes",
    postalCode: "83870",
    inseeCode: "83127",
    department: "Var",
    region: "Provence-Alpes-Cote d'Azur",
    latitude: 43.2759,
    longitude: 5.8498,
    nearbySlugs: ["le-castellet", "evenos", "cuges-les-pins", "toulon"],
  },
  {
    slug: "six-fours-les-plages",
    name: "Six-Fours-les-Plages",
    postalCode: "83140",
    inseeCode: "83129",
    department: "Var",
    region: "Provence-Alpes-Cote d'Azur",
    latitude: 43.0843,
    longitude: 5.8079,
    nearbySlugs: ["sanary-sur-mer", "la-seyne-sur-mer", "ollioules", "toulon"],
  },
  {
    slug: "la-seyne-sur-mer",
    name: "La Seyne-sur-Mer",
    postalCode: "83500",
    inseeCode: "83126",
    department: "Var",
    region: "Provence-Alpes-Cote d'Azur",
    latitude: 43.0837,
    longitude: 5.8789,
    nearbySlugs: ["six-fours-les-plages", "toulon", "ollioules", "sanary-sur-mer"],
  },
  {
    slug: "carnoux-en-provence",
    name: "Carnoux-en-Provence",
    postalCode: "13470",
    inseeCode: "13119",
    department: "Bouches-du-Rhone",
    region: "Provence-Alpes-Cote d'Azur",
    latitude: 43.259,
    longitude: 5.5655,
    nearbySlugs: ["cassis", "roquefort-la-bedoule", "aubagne", "marseille"],
  },
  {
    slug: "auriol",
    name: "Auriol",
    postalCode: "13390",
    inseeCode: "13007",
    department: "Bouches-du-Rhone",
    region: "Provence-Alpes-Cote d'Azur",
    latitude: 43.3594,
    longitude: 5.6559,
    nearbySlugs: ["aubagne", "gemenos", "cuges-les-pins", "la-penne-sur-huveaune"],
  },
  {
    slug: "cuges-les-pins",
    name: "Cuges-les-Pins",
    postalCode: "13780",
    inseeCode: "13030",
    department: "Bouches-du-Rhone",
    region: "Provence-Alpes-Cote d'Azur",
    latitude: 43.2822,
    longitude: 5.7099,
    nearbySlugs: ["gemenos", "ceyreste", "saint-cyr-sur-mer", "auriol"],
  },
  {
    slug: "la-penne-sur-huveaune",
    name: "La Penne-sur-Huveaune",
    postalCode: "13821",
    inseeCode: "13070",
    department: "Bouches-du-Rhone",
    region: "Provence-Alpes-Cote d'Azur",
    latitude: 43.2778,
    longitude: 5.5185,
    nearbySlugs: ["aubagne", "marseille", "carnoux-en-provence", "auriol"],
  },
  {
    slug: "marseille",
    name: "Marseille",
    postalCode: "13000",
    inseeCode: "13055",
    department: "Bouches-du-Rhone",
    region: "Provence-Alpes-Cote d'Azur",
    latitude: 43.2965,
    longitude: 5.3698,
    nearbySlugs: ["la-penne-sur-huveaune", "aubagne", "carnoux-en-provence", "cassis"],
  },
  {
    slug: "aix-en-provence",
    name: "Aix-en-Provence",
    postalCode: "13100",
    inseeCode: "13001",
    department: "Bouches-du-Rhone",
    region: "Provence-Alpes-Cote d'Azur",
    latitude: 43.5297,
    longitude: 5.4474,
    nearbySlugs: ["marseille", "aubagne", "avignon"],
  },
  {
    slug: "toulon",
    name: "Toulon",
    postalCode: "83000",
    inseeCode: "83137",
    department: "Var",
    region: "Provence-Alpes-Cote d'Azur",
    latitude: 43.1364,
    longitude: 5.9334,
    nearbySlugs: ["la-valette-du-var", "ollioules", "la-seyne-sur-mer", "evenos"],
  },
  {
    slug: "la-valette-du-var",
    name: "La Valette-du-Var",
    postalCode: "83160",
    inseeCode: "83144",
    department: "Var",
    region: "Provence-Alpes-Cote d'Azur",
    latitude: 43.1484,
    longitude: 5.9893,
    nearbySlugs: ["toulon", "hyeres", "la-seyne-sur-mer", "ollioules"],
  },
  {
    slug: "nice",
    name: "Nice",
    postalCode: "06000",
    inseeCode: "06088",
    department: "Alpes-Maritimes",
    region: "Provence-Alpes-Cote d'Azur",
    latitude: 43.7102,
    longitude: 7.262,
    nearbySlugs: ["cannes", "antibes", "frejus"],
  },
  {
    slug: "montpellier",
    name: "Montpellier",
    postalCode: "34000",
    inseeCode: "34172",
    department: "Herault",
    region: "Occitanie",
    latitude: 43.6108,
    longitude: 3.8767,
    nearbySlugs: ["nimes", "beziers", "avignon"],
  },
  {
    slug: "nimes",
    name: "Nimes",
    postalCode: "30000",
    inseeCode: "30189",
    department: "Gard",
    region: "Occitanie",
    latitude: 43.8374,
    longitude: 4.3601,
    nearbySlugs: ["montpellier", "avignon", "arles"],
  },
  {
    slug: "avignon",
    name: "Avignon",
    postalCode: "84000",
    inseeCode: "84007",
    department: "Vaucluse",
    region: "Provence-Alpes-Cote d'Azur",
    latitude: 43.9493,
    longitude: 4.8055,
    nearbySlugs: ["nimes", "arles", "aix-en-provence"],
  },
  {
    slug: "cannes",
    name: "Cannes",
    postalCode: "06400",
    inseeCode: "06029",
    department: "Alpes-Maritimes",
    region: "Provence-Alpes-Cote d'Azur",
    latitude: 43.5528,
    longitude: 7.0174,
    nearbySlugs: ["nice", "antibes", "frejus"],
  },
  {
    slug: "antibes",
    name: "Antibes",
    postalCode: "06600",
    inseeCode: "06004",
    department: "Alpes-Maritimes",
    region: "Provence-Alpes-Cote d'Azur",
    latitude: 43.5804,
    longitude: 7.1251,
    nearbySlugs: ["nice", "cannes", "frejus"],
  },
  {
    slug: "perpignan",
    name: "Perpignan",
    postalCode: "66000",
    inseeCode: "66136",
    department: "Pyrenees-Orientales",
    region: "Occitanie",
    latitude: 42.6887,
    longitude: 2.8948,
    nearbySlugs: ["narbonne", "beziers", "montpellier"],
  },
  {
    slug: "beziers",
    name: "Beziers",
    postalCode: "34500",
    inseeCode: "34032",
    department: "Herault",
    region: "Occitanie",
    latitude: 43.3442,
    longitude: 3.2158,
    nearbySlugs: ["narbonne", "montpellier", "perpignan"],
  },
  {
    slug: "narbonne",
    name: "Narbonne",
    postalCode: "11100",
    inseeCode: "11262",
    department: "Aude",
    region: "Occitanie",
    latitude: 43.1843,
    longitude: 3.0031,
    nearbySlugs: ["beziers", "perpignan", "montpellier"],
  },
  {
    slug: "arles",
    name: "Arles",
    postalCode: "13200",
    inseeCode: "13004",
    department: "Bouches-du-Rhone",
    region: "Provence-Alpes-Cote d'Azur",
    latitude: 43.6766,
    longitude: 4.6278,
    nearbySlugs: ["avignon", "nimes", "aix-en-provence"],
  },
  {
    slug: "hyeres",
    name: "Hyères",
    postalCode: "83400",
    inseeCode: "83069",
    department: "Var",
    region: "Provence-Alpes-Cote d'Azur",
    latitude: 43.1205,
    longitude: 6.1286,
    nearbySlugs: ["toulon", "frejus", "nice"],
  },
  {
    slug: "frejus",
    name: "Fréjus",
    postalCode: "83600",
    inseeCode: "83061",
    department: "Var",
    region: "Provence-Alpes-Cote d'Azur",
    latitude: 43.4332,
    longitude: 6.737,
    nearbySlugs: ["hyeres", "cannes", "nice"],
  },
];

export function getCityBySlug(slug: string) {
  return southCities.find((city) => city.slug === slug);
}

export function getCityByMarketIdentifier({
  inseeCode,
  name,
}: {
  inseeCode?: string;
  name?: string;
}) {
  if (inseeCode) {
    const cityByCode = southCities.find((city) => city.inseeCode === inseeCode);

    if (cityByCode) {
      return cityByCode;
    }
  }

  if (!name) {
    return undefined;
  }

  const normalizedName = normalizeCityName(name);

  return southCities.find((city) => normalizeCityName(city.name) === normalizedName);
}

export function getNearbyCities(city: City) {
  return city.nearbySlugs
    .map((slug) => getCityBySlug(slug))
    .filter((nearbyCity): nearbyCity is City => Boolean(nearbyCity));
}

function normalizeCityName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}
