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
    nearbySlugs: ["ceyreste", "cuges-les-pins", "toulon", "cassis"],
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
    latitude: 43.1242,
    longitude: 5.928,
    nearbySlugs: ["saint-cyr-sur-mer", "hyeres", "cuges-les-pins", "aubagne"],
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
