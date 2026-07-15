import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { BuyerSearchMarketScore } from "@/lib/buyer-search/market-score-types";
import { MarketScoreCard } from "./MarketScoreCard";

const score: BuyerSearchMarketScore = {
  bestMatch: {
    cityCode: "13005",
    cityName: "Aubagne",
    comparableTransactions: 8,
    gapPercent: -12,
    marketPricePerM2: 4_200,
    propertyType: "apartment",
    score: 68,
  },
  combinations: [],
  computedAt: "2026-07-15T12:00:00.000Z",
  factors: [],
  label: "Recherche coherente",
  methodVersion: "price-sqm-v3",
  score: 68,
  source: "immo-data",
  status: "coherent",
  target: {
    idealBudget: 320_000,
    idealCapacityPerM2: 3_200,
    maximumBudget: 350_000,
    maximumCapacityPerM2: 3_500,
    minimumLivingArea: 100,
  },
};

describe("MarketScoreCard", () => {
  it("hides the best match for a single-city search", () => {
    render(<MarketScoreCard score={score} showBestMatch={false} />);

    expect(screen.queryByText(/Meilleure coherence/i)).not.toBeInTheDocument();
  });

  it("links the best match when a city market page exists", () => {
    render(<MarketScoreCard score={score} />);

    expect(screen.getByRole("link", { name: "Aubagne" })).toHaveAttribute(
      "href",
      "/prix-immobilier/aubagne",
    );
  });
});
