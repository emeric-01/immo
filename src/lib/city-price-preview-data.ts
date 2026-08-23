import type { CityMarketData } from "./city-market-data";

// Preview-only fallback captured from the public Aubagne snapshot on 2026-08-16.
// The canonical price page never reads this fixture.
const aubagnePricePreviewSnapshot: CityMarketData = {
  source: "immo-data",
  updatedAt: "2026-08-16",
  apartment: {
    averagePricePerM2: 2713,
    lowPricePerM2: 2081,
    highPricePerM2: 3361,
    confidenceScore: 4,
    trend1Year: -1,
    rangeSource: "transactions",
    trendSource: "history",
  },
  house: {
    averagePricePerM2: 4720,
    lowPricePerM2: 3234,
    highPricePerM2: 4732,
    confidenceScore: 4,
    trend1Year: -5,
    rangeSource: "transactions",
    trendSource: "history",
  },
  history: [
    { apartment: 2518, house: 3609, period: "2014-01" },
    { apartment: 2438, house: 3570, period: "2015-01" },
    { apartment: 2390, house: 3579, period: "2016-01" },
    { apartment: 2373, house: 3616, period: "2017-01" },
    { apartment: 2361, house: 3703, period: "2018-01" },
    { apartment: 2424, house: 3852, period: "2019-01" },
    { apartment: 2491, house: 4034, period: "2020-01" },
    { apartment: 2589, house: 4283, period: "2021-01" },
    { apartment: 2704, house: 4579, period: "2022-01" },
    { apartment: 2869, house: 4961, period: "2023-01" },
    { apartment: 2812, house: 4893, period: "2024-01" },
    { apartment: 2731, house: 4711, period: "2025-01" },
    { apartment: 2726, house: 4720, period: "2026-01" },
    { apartment: 2713, house: 4720, period: "2026-07" },
  ],
  zones: [],
  salePoints: [
    {
      id: "aubagne-preview-cle-des-champs",
      label: "Résidence Clé des Champs",
      latitude: 43.291281,
      longitude: 5.582375,
      price: 165000,
      pricePerM2: 2200,
      propertyType: "Appartement",
      rooms: 4,
      soldAt: "2025-12-30",
      surfaceM2: 75,
    },
    {
      id: "aubagne-preview-pierre-blancard",
      label: "Promenade Pierre Blancard",
      latitude: 43.296218,
      longitude: 5.561272,
      price: 177000,
      pricePerM2: 3933,
      propertyType: "Appartement",
      rooms: 2,
      soldAt: "2025-12-29",
      surfaceM2: 45,
    },
    {
      id: "aubagne-preview-verger-passons",
      label: "Résidence Le Verger des Passons",
      latitude: 43.291581,
      longitude: 5.584883,
      price: 154100,
      pricePerM2: 2371,
      propertyType: "Appartement",
      rooms: 3,
      soldAt: "2025-12-29",
      surfaceM2: 65,
    },
    {
      id: "aubagne-preview-chemin-fer",
      label: "Traverse du Chemin de Fer",
      latitude: 43.287638,
      longitude: 5.547533,
      price: 330000,
      pricePerM2: 2619,
      propertyType: "Maison",
      rooms: 6,
      soldAt: "2025-12-23",
      surfaceM2: 126,
    },
  ],
  transactionCount: 5529,
  saleDurationDays: 45,
  neighborhoods: [],
  expensiveStreets: [],
  affordableStreets: [],
  localInfo: {
    population: 47724,
    density: 871,
    areaKm2: 54.8,
    homes: 21025,
    ownerShare: 48.7,
    source: "INSEE",
    vintage: 2022,
  },
};

const aubagneNearbyPreviewPrices: Record<string, { apartment: number; house: number }> = {
  auriol: { apartment: 3210, house: 4643 },
  "carnoux-en-provence": { apartment: 3895, house: 4807 },
  gemenos: { apartment: 3436, house: 4932 },
  "la-penne-sur-huveaune": { apartment: 3634, house: 4647 },
};

export function getCityPricePreviewSnapshot(citySlug: string) {
  return citySlug === "aubagne" ? aubagnePricePreviewSnapshot : null;
}

export function getAubagneNearbyPreviewPrice(citySlug: string) {
  return aubagneNearbyPreviewPrices[citySlug] ?? null;
}
