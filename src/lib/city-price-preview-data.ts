import type { CityMarketData } from "./city-market-data";
import { aubagnePreviewZones } from "./aubagne-preview-zones";

// Preview-only Aubagne snapshot based on official DVF statistics for 2014–2025.
// The 2014–2020 annual medians come from the public Cerema DVF+ API; the
// 2021–2025 points come from the latest geolocated DVF release on data.gouv.fr.
// The central values are the commune medians published by data.gouv.fr.
// The displayed ranges use the first and third quartiles of comparable resale transactions (Q1–Q3).
// The canonical price page never reads this fixture.
const aubagnePricePreviewSnapshot: CityMarketData = {
  source: "dvf",
  updatedAt: "2026-04-27",
  apartment: {
    averagePricePerM2: 2744,
    lowPricePerM2: 2268,
    highPricePerM2: 3298,
    confidenceScore: 4,
    trend1Year: -2.8,
    rangeSource: "transactions",
    trendSource: "history",
  },
  house: {
    averagePricePerM2: 4479,
    lowPricePerM2: 3598,
    highPricePerM2: 5373,
    confidenceScore: 4,
    trend1Year: -3.1,
    rangeSource: "transactions",
    trendSource: "history",
  },
  history: [
    { apartment: 2588, house: 3474, period: "2014" },
    { apartment: 2423, house: 3537, period: "2015" },
    { apartment: 2500, house: 3534, period: "2016" },
    { apartment: 2356, house: 3608, period: "2017" },
    { apartment: 2398, house: 3613, period: "2018" },
    { apartment: 2388, house: 3907, period: "2019" },
    { apartment: 2573, house: 4041, period: "2020" },
    { apartment: 2583, house: 4313, period: "2021" },
    { apartment: 2783, house: 4389, period: "2022" },
    { apartment: 2888, house: 4822, period: "2023" },
    { apartment: 2706, house: 4492, period: "2024" },
    { apartment: 2631, house: 4354, period: "2025" },
  ],
  zones: aubagnePreviewZones,
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
  transactionCount: 2573,
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
  auriol: { apartment: 3264, house: 4543 },
  "carnoux-en-provence": { apartment: 3440, house: 5097 },
  gemenos: { apartment: 4184, house: 5496 },
  "la-penne-sur-huveaune": { apartment: 3309, house: 4703 },
};

export function getCityPricePreviewSnapshot(citySlug: string) {
  return citySlug === "aubagne" ? aubagnePricePreviewSnapshot : null;
}

export function getAubagneNearbyPreviewPrice(citySlug: string) {
  return aubagneNearbyPreviewPrices[citySlug] ?? null;
}
