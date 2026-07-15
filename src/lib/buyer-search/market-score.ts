import "server-only";

import { normalizePropertyTypes } from "./options";
import type { BuyerSearchFormData, PropertyType } from "./types";
import type {
  BuyerSearchMarketCombination,
  BuyerSearchMarketFactor,
  BuyerSearchMarketScore,
  BuyerSearchMarketScoreStatus,
} from "./market-score-types";

type ImmoDataConfig = {
  apiKey: string;
  baseUrl: string;
};

type CurrentPriceResponse = {
  value: number | null;
};

type TransactionsResponse = {
  total?: number;
};

const MAX_SCORING_CITIES = 5;
const REQUEST_TIMEOUT_MS = 8_000;

export async function analyzeBuyerSearchMarket(
  data: BuyerSearchFormData,
): Promise<BuyerSearchMarketScore | null> {
  const config = getImmoDataConfig();
  const idealBudget = data.property.idealBudget;
  const maximumBudget = data.property.maximumBudget;
  const minimumLivingArea = data.characteristics.minimumLivingArea;
  const propertyTypes = normalizePropertyTypes(data.property.types?.length ? data.property.types : data.property.type);
  const cities = data.location.cities.slice(0, MAX_SCORING_CITIES);

  if (
    !config ||
    !idealBudget ||
    !maximumBudget ||
    !minimumLivingArea ||
    propertyTypes.length === 0 ||
    cities.length === 0
  ) {
    return null;
  }

  const idealCapacityPerM2 = Math.round(idealBudget / minimumLivingArea);
  const maximumCapacityPerM2 = Math.round(maximumBudget / minimumLivingArea);
  const combinations = (
    await Promise.all(
      cities.flatMap((city) =>
        propertyTypes.map((propertyType) =>
          analyzeCombination(config, data, city, propertyType, maximumCapacityPerM2),
        ),
      ),
    )
  ).filter((combination): combination is BuyerSearchMarketCombination => Boolean(combination));

  if (combinations.length === 0) {
    return null;
  }

  combinations.sort((left, right) => right.score - left.score);
  const bestMatch = combinations[0];
  const score = bestMatch.score;

  return {
    bestMatch,
    combinations,
    computedAt: new Date().toISOString(),
    factors: buildFactors(data, bestMatch),
    label: marketScoreLabel(score),
    methodVersion: "price-sqm-v1",
    score,
    source: "immo-data",
    status: marketScoreStatus(score),
    target: {
      idealBudget,
      idealCapacityPerM2,
      maximumBudget,
      maximumCapacityPerM2,
      minimumLivingArea,
    },
  };
}

async function analyzeCombination(
  config: ImmoDataConfig,
  data: BuyerSearchFormData,
  city: BuyerSearchFormData["location"]["cities"][number],
  propertyType: PropertyType,
  maximumCapacityPerM2: number,
): Promise<BuyerSearchMarketCombination | null> {
  if (!city.cityCode) {
    return null;
  }

  const priceParams = new URLSearchParams({
    code: city.cityCode,
    geoLevel: "city",
    marketType: "sales",
    metric: "sqm_price",
    realtyType: propertyType,
  });
  const transactionParams = buildTransactionParams(data, city, propertyType);
  const [currentPrice, transactions] = await Promise.all([
    optionalImmoData(() =>
      fetchImmoData<CurrentPriceResponse>(config, "/v1/market/price/current", priceParams),
    ),
    transactionParams
      ? optionalImmoData(() =>
          fetchImmoData<TransactionsResponse>(config, "/v1/transactions", transactionParams),
        )
      : undefined,
  ]);
  const marketPricePerM2 = currentPrice?.value;

  if (!marketPricePerM2 || marketPricePerM2 <= 0) {
    return null;
  }

  const comparableTransactions = Math.max(0, transactions?.total ?? 0);
  const gapPercent = Number(
    (((maximumCapacityPerM2 - marketPricePerM2) / marketPricePerM2) * 100).toFixed(1),
  );

  return {
    cityCode: city.cityCode,
    cityName: city.name,
    comparableTransactions,
    gapPercent,
    marketPricePerM2: Math.round(marketPricePerM2),
    propertyType,
    score: calculateMarketCombinationScore(
      maximumCapacityPerM2,
      marketPricePerM2,
      comparableTransactions,
    ),
  };
}

function buildTransactionParams(
  data: BuyerSearchFormData,
  city: BuyerSearchFormData["location"]["cities"][number],
  propertyType: PropertyType,
) {
  const maximumBudget = data.property.maximumBudget;
  const minimumLivingArea = data.characteristics.minimumLivingArea;

  if (!maximumBudget || !minimumLivingArea) {
    return null;
  }

  const params = new URLSearchParams({
    dateMax: isoDate(new Date()),
    dateMin: isoDate(monthsAgo(24)),
    livingAreaMin: String(Math.round(minimumLivingArea)),
    priceMax: String(Math.round(maximumBudget)),
    realtyType: propertyType,
    size: "100",
    sortBy: "date",
    sortOrder: "desc",
    txType: "sales",
  });

  if (typeof city.latitude === "number" && typeof city.longitude === "number") {
    const radiusMeters = Math.round(Math.min(50, Math.max(1, city.radiusKm ?? 2)) * 1000);
    params.set("latitude", String(city.latitude));
    params.set("longitude", String(city.longitude));
    params.set("radius", String(radiusMeters));
  } else if (city.cityCode) {
    params.set("code", city.cityCode);
    params.set("geoLevel", "city");
  } else {
    return null;
  }

  if ((data.characteristics.minimumRooms ?? 0) > 0) {
    params.set("minRoom", String(Math.round(data.characteristics.minimumRooms ?? 0)));
  }

  if (propertyType === "house" && (data.preferences.minimumLandArea ?? 0) > 0) {
    params.set("landAreaMin", String(Math.round(data.preferences.minimumLandArea ?? 0)));
  }

  return params;
}

export function calculateMarketCombinationScore(
  maximumCapacityPerM2: number,
  marketPricePerM2: number,
  comparableTransactions: number,
) {
  const ratio = marketPricePerM2 > 0 ? maximumCapacityPerM2 / marketPricePerM2 : 0;
  const affordabilityScore = interpolateScore(ratio);
  const volumeScore =
    comparableTransactions >= 20
      ? 100
      : comparableTransactions >= 10
        ? 85
        : comparableTransactions >= 5
          ? 72
          : comparableTransactions >= 1
            ? 58
            : 25;

  return clamp(Math.round(affordabilityScore * 0.8 + volumeScore * 0.2), 0, 100);
}

function interpolateScore(ratio: number) {
  const points = [
    { ratio: 0, score: 10 },
    { ratio: 0.6, score: 25 },
    { ratio: 0.7, score: 40 },
    { ratio: 0.8, score: 55 },
    { ratio: 0.9, score: 72 },
    { ratio: 0.95, score: 84 },
    { ratio: 1, score: 94 },
    { ratio: 1.05, score: 100 },
  ];

  if (ratio <= points[0].ratio) {
    return points[0].score;
  }

  for (let index = 1; index < points.length; index += 1) {
    const upper = points[index];
    const lower = points[index - 1];

    if (ratio <= upper.ratio) {
      const progress = (ratio - lower.ratio) / (upper.ratio - lower.ratio);
      return lower.score + (upper.score - lower.score) * progress;
    }
  }

  return 100;
}

function buildFactors(
  data: BuyerSearchFormData,
  bestMatch: BuyerSearchMarketCombination,
): BuyerSearchMarketFactor[] {
  const factors: BuyerSearchMarketFactor[] = [];

  if (bestMatch.gapPercent >= 0) {
    factors.push({ label: "Budget compatible avec le prix moyen constate", tone: "positive" });
  } else if (bestMatch.gapPercent >= -10) {
    factors.push({ label: "Budget proche des prix constates", tone: "positive" });
  } else {
    factors.push({
      label: `Budget ${Math.abs(Math.round(bestMatch.gapPercent))} % sous le prix moyen`,
      tone: "warning",
    });
  }

  factors.push({
    label:
      bestMatch.comparableTransactions > 0
        ? `${bestMatch.comparableTransactions} ventes comparables observees`
        : "Aucune vente strictement comparable observee",
    tone: bestMatch.comparableTransactions > 0 ? "positive" : "warning",
  });

  if (bestMatch.propertyType === "house" && data.preferences.minimumLandArea) {
    factors.push({
      label: `Terrain de ${data.preferences.minimumLandArea} m2 plus selectif`,
      tone: "info",
    });
  } else {
    factors.push({ label: `${bestMatch.cityName} offre la meilleure coherence`, tone: "info" });
  }

  return factors;
}

function marketScoreLabel(score: number) {
  if (score >= 85) {
    return "Recherche tres coherente";
  }

  if (score >= 70) {
    return "Recherche realiste";
  }

  if (score >= 55) {
    return "Recherche exigeante";
  }

  return "Recherche difficile";
}

function marketScoreStatus(score: number): BuyerSearchMarketScoreStatus {
  if (score >= 85) {
    return "excellent";
  }

  if (score >= 70) {
    return "coherent";
  }

  if (score >= 55) {
    return "tight";
  }

  return "difficult";
}

function getImmoDataConfig(): ImmoDataConfig | null {
  const apiKey = process.env.IMMO_DATA_API_KEY?.trim();

  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
    baseUrl: (process.env.IMMO_DATA_BASE_URL?.trim() || "https://api.immo-data.fr").replace(/\/$/, ""),
  };
}

async function optionalImmoData<T>(callback: () => Promise<T>): Promise<T | undefined> {
  try {
    return await callback();
  } catch (error) {
    console.warn("Buyer search market data unavailable", error);
    return undefined;
  }
}

async function fetchImmoData<T>(
  config: ImmoDataConfig,
  path: string,
  params: URLSearchParams,
): Promise<T> {
  const response = await fetch(`${config.baseUrl}${path}?${params.toString()}`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Immo Data ${path} failed (${response.status}): ${message}`);
  }

  return response.json() as Promise<T>;
}

function monthsAgo(months: number) {
  const date = new Date();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() - months);
  return date;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
