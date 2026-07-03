import type { City } from "./cities";

export type PropertyMarketStat = {
  averagePricePerM2: number;
  lowPricePerM2: number;
  highPricePerM2: number;
  confidenceScore: number;
  trend1Year: number;
};

export type CityPriceHistoryPoint = {
  period: string;
  apartment: number;
  house: number;
};

export type CityPriceZone = {
  id: string;
  name: string;
  pricePerM2: number;
  color: string;
  polygon: [number, number][];
};

export type CitySalePoint = {
  id: string;
  label: string;
  propertyType: "Appartement" | "Maison";
  rooms: number;
  surfaceM2: number;
  soldAt: string;
  longitude: number;
  latitude: number;
};

export type CityMarketData = {
  updatedAt: string;
  apartment: PropertyMarketStat;
  house: PropertyMarketStat;
  rent: {
    apartmentPerM2: number;
    housePerM2: number;
  };
  history: CityPriceHistoryPoint[];
  zones: CityPriceZone[];
  salePoints: CitySalePoint[];
  neighborhoods: Array<{
    name: string;
    pricePerM2: number;
  }>;
  expensiveStreets: Array<{
    name: string;
    pricePerM2: number;
  }>;
  affordableStreets: Array<{
    name: string;
    pricePerM2: number;
  }>;
  localInfo: {
    population: number;
    medianAge: number;
    density: number;
    areaKm2: number;
    homes: number;
    ownerShare: number;
  };
};

const aubagneMarketData: CityMarketData = {
  updatedAt: "2026-07-01",
  apartment: {
    averagePricePerM2: 3751,
    lowPricePerM2: 2270,
    highPricePerM2: 5675,
    confidenceScore: 4,
    trend1Year: -1.4,
  },
  house: {
    averagePricePerM2: 3755,
    lowPricePerM2: 1759,
    highPricePerM2: 6233,
    confidenceScore: 3,
    trend1Year: -5,
  },
  rent: {
    apartmentPerM2: 16.2,
    housePerM2: 16.8,
  },
  history: [
    { period: "2015", apartment: 2940, house: 3090 },
    { period: "2016", apartment: 3020, house: 3190 },
    { period: "2017", apartment: 3150, house: 3270 },
    { period: "2018", apartment: 3180, house: 3320 },
    { period: "2019", apartment: 3370, house: 3510 },
    { period: "2020", apartment: 3440, house: 3560 },
    { period: "2021", apartment: 3610, house: 3710 },
    { period: "2022", apartment: 3890, house: 3980 },
    { period: "2023", apartment: 4070, house: 4160 },
    { period: "2024", apartment: 3720, house: 3840 },
    { period: "2025", apartment: 3810, house: 3890 },
    { period: "2026", apartment: 3751, house: 3755 },
  ],
  zones: [
    {
      id: "centre-ville",
      name: "Centre-ville",
      pricePerM2: 4107,
      color: "#3ecf5a",
      polygon: [
        [5.561, 43.295],
        [5.57, 43.302],
        [5.581, 43.297],
        [5.58, 43.289],
        [5.568, 43.286],
        [5.558, 43.29],
        [5.561, 43.295],
      ],
    },
    {
      id: "charrel",
      name: "Charrel",
      pricePerM2: 3536,
      color: "#f5ef55",
      polygon: [
        [5.545, 43.296],
        [5.558, 43.304],
        [5.57, 43.302],
        [5.561, 43.295],
        [5.548, 43.289],
        [5.542, 43.292],
        [5.545, 43.296],
      ],
    },
    {
      id: "paluds",
      name: "Les Paluds",
      pricePerM2: 3674,
      color: "#f5a15b",
      polygon: [
        [5.581, 43.297],
        [5.604, 43.302],
        [5.614, 43.292],
        [5.596, 43.283],
        [5.58, 43.289],
        [5.581, 43.297],
      ],
    },
    {
      id: "peripherie-est",
      name: "Peripherie est",
      pricePerM2: 2997,
      color: "#9be74d",
      polygon: [
        [5.596, 43.283],
        [5.614, 43.292],
        [5.629, 43.284],
        [5.619, 43.271],
        [5.6, 43.273],
        [5.596, 43.283],
      ],
    },
    {
      id: "secteur-prime",
      name: "Secteur premium",
      pricePerM2: 4908,
      color: "#ff5a52",
      polygon: [
        [5.548, 43.289],
        [5.568, 43.286],
        [5.558, 43.278],
        [5.538, 43.281],
        [5.548, 43.289],
      ],
    },
  ],
  salePoints: [
    {
      id: "sale-1",
      label: "Impasse des Capucines",
      propertyType: "Maison",
      rooms: 5,
      surfaceM2: 189,
      soldAt: "Juillet 2026",
      longitude: 5.565,
      latitude: 43.293,
    },
    {
      id: "sale-2",
      label: "Chemin des Espillieres",
      propertyType: "Appartement",
      rooms: 3,
      surfaceM2: 73,
      soldAt: "Juillet 2026",
      longitude: 5.574,
      latitude: 43.287,
    },
    {
      id: "sale-3",
      label: "Traverse Helene",
      propertyType: "Maison",
      rooms: 4,
      surfaceM2: 106,
      soldAt: "Juin 2026",
      longitude: 5.558,
      latitude: 43.299,
    },
    {
      id: "sale-4",
      label: "Impasse des Albizias",
      propertyType: "Maison",
      rooms: 5,
      surfaceM2: 170,
      soldAt: "Juin 2026",
      longitude: 5.589,
      latitude: 43.292,
    },
    {
      id: "sale-5",
      label: "Avenue du 21 Aout 1944",
      propertyType: "Appartement",
      rooms: 4,
      surfaceM2: 82,
      soldAt: "Mai 2026",
      longitude: 5.552,
      latitude: 43.286,
    },
    {
      id: "sale-6",
      label: "Rue de la Republique",
      propertyType: "Appartement",
      rooms: 2,
      surfaceM2: 48,
      soldAt: "Mai 2026",
      longitude: 5.571,
      latitude: 43.296,
    },
  ],
  neighborhoods: [
    { name: "Grand Quartier 01", pricePerM2: 2997 },
    { name: "Grand Quartier 02", pricePerM2: 3500 },
    { name: "Grand Quartier 03", pricePerM2: 3536 },
    { name: "Grand Quartier 04", pricePerM2: 3674 },
    { name: "Grand Quartier 05", pricePerM2: 3320 },
    { name: "Grand Quartier 06", pricePerM2: 3859 },
    { name: "Grand Quartier 07", pricePerM2: 4107 },
  ],
  expensiveStreets: [
    { name: "Chemin de la Croix", pricePerM2: 4908 },
    { name: "Chemin de la Durande", pricePerM2: 4908 },
    { name: "Chemin des Boyers", pricePerM2: 4908 },
    { name: "Lotissement Joinville", pricePerM2: 4908 },
    { name: "Lotissement l'Ouliveiredo", pricePerM2: 4908 },
  ],
  affordableStreets: [
    { name: "Rue Gachiou", pricePerM2: 2777 },
    { name: "Rue Rastegue", pricePerM2: 2787 },
    { name: "Rue Martinot", pricePerM2: 2792 },
    { name: "Rue de Guin", pricePerM2: 2795 },
    { name: "Rue Frederic Mistral", pricePerM2: 2796 },
  ],
  localInfo: {
    population: 47724,
    medianAge: 42,
    density: 871,
    areaKm2: 54.8,
    homes: 21025,
    ownerShare: 48.7,
  },
};

function shiftMarketData(city: City): CityMarketData {
  const seed = city.inseeCode
    .split("")
    .reduce((total, character) => total + Number(character), 0);
  const multiplier = 0.85 + (seed % 9) * 0.055;
  const averageApartment = Math.round(aubagneMarketData.apartment.averagePricePerM2 * multiplier);
  const averageHouse = Math.round(aubagneMarketData.house.averagePricePerM2 * (multiplier + 0.03));

  return {
    ...aubagneMarketData,
    apartment: {
      ...aubagneMarketData.apartment,
      averagePricePerM2: averageApartment,
      lowPricePerM2: Math.round(averageApartment * 0.61),
      highPricePerM2: Math.round(averageApartment * 1.51),
    },
    house: {
      ...aubagneMarketData.house,
      averagePricePerM2: averageHouse,
      lowPricePerM2: Math.round(averageHouse * 0.47),
      highPricePerM2: Math.round(averageHouse * 1.66),
    },
    history: aubagneMarketData.history.map((point) => ({
      period: point.period,
      apartment: Math.round(point.apartment * multiplier),
      house: Math.round(point.house * (multiplier + 0.03)),
    })),
    zones: aubagneMarketData.zones.map((zone, index) => ({
      ...zone,
      pricePerM2: Math.round(zone.pricePerM2 * multiplier),
      polygon: zone.polygon.map(([longitude, latitude]) => [
        longitude + (city.longitude - 5.5707),
        latitude + (city.latitude - 43.2928),
      ]),
      id: `${city.slug}-${index}`,
    })),
    salePoints: aubagneMarketData.salePoints.map((point, index) => ({
      ...point,
      id: `${city.slug}-sale-${index}`,
      longitude: point.longitude + (city.longitude - 5.5707),
      latitude: point.latitude + (city.latitude - 43.2928),
    })),
    neighborhoods: aubagneMarketData.neighborhoods.map((neighborhood) => ({
      ...neighborhood,
      pricePerM2: Math.round(neighborhood.pricePerM2 * multiplier),
    })),
    expensiveStreets: aubagneMarketData.expensiveStreets.map((street) => ({
      ...street,
      pricePerM2: Math.round(street.pricePerM2 * multiplier),
    })),
    affordableStreets: aubagneMarketData.affordableStreets.map((street) => ({
      ...street,
      pricePerM2: Math.round(street.pricePerM2 * multiplier),
    })),
  };
}

export function getCityMarketData(city: City): CityMarketData {
  if (city.slug === "aubagne") {
    return aubagneMarketData;
  }

  return shiftMarketData(city);
}
