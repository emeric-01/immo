import type { PropertyType } from "./types";

export type BuyerSearchMarketScoreStatus = "excellent" | "coherent" | "tight" | "difficult";
export type BuyerSearchMarketFactorTone = "positive" | "warning" | "info";

export type BuyerSearchMarketFactor = {
  label: string;
  tone: BuyerSearchMarketFactorTone;
};

export type BuyerSearchMarketCombination = {
  cityCode?: string;
  cityName: string;
  comparableTransactions: number;
  gapPercent: number;
  marketPricePerM2: number;
  propertyType: PropertyType;
  score: number;
};

export type BuyerSearchMarketScore = {
  bestMatch: BuyerSearchMarketCombination;
  combinations: BuyerSearchMarketCombination[];
  computedAt: string;
  factors: BuyerSearchMarketFactor[];
  label: string;
  methodVersion: "price-sqm-v1" | "price-sqm-v2";
  score: number;
  source: "immo-data";
  status: BuyerSearchMarketScoreStatus;
  target: {
    idealBudget: number;
    idealCapacityPerM2: number;
    maximumBudget: number;
    maximumCapacityPerM2: number;
    minimumLivingArea: number;
  };
};

export function isBuyerSearchMarketScore(value: unknown): value is BuyerSearchMarketScore {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<BuyerSearchMarketScore>;

  return (
    typeof candidate.score === "number" &&
    typeof candidate.label === "string" &&
    typeof candidate.computedAt === "string" &&
    (candidate.methodVersion === "price-sqm-v1" || candidate.methodVersion === "price-sqm-v2") &&
    Boolean(candidate.bestMatch) &&
    Boolean(candidate.target)
  );
}
