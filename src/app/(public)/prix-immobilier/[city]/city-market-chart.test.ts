import { describe, expect, it } from "vitest";
import type { CityPriceHistoryPoint } from "@/lib/city-market-data";
import { prepareCityPriceHistoryForDisplay } from "@/lib/price-history";
import { filterCityMarketPoints } from "./city-market-chart";

const annualHistory: CityPriceHistoryPoint[] = Array.from({ length: 12 }, (_, index) => ({
  apartment: 2_500 + index,
  house: 3_500 + index,
  period: String(2014 + index),
}));

describe("city market chart periods", () => {
  it("shows the complete history by default", () => {
    expect(filterCityMarketPoints(annualHistory, "all")).toEqual(annualHistory);
  });

  it("keeps the five latest calendar years for the 5-year view", () => {
    expect(filterCityMarketPoints(annualHistory, "5y").map((point) => point.period)).toEqual([
      "2021",
      "2022",
      "2023",
      "2024",
      "2025",
    ]);
  });

  it("starts at the first year containing an observed price", () => {
    const points = prepareCityPriceHistoryForDisplay([
      { apartment: 0, house: 0, period: "2014" },
      { apartment: 0, house: 0, period: "2020" },
      { apartment: 4_100, house: 5_200, period: "2021" },
      { apartment: 4_200, house: 5_300, period: "2022" },
    ]);

    expect(filterCityMarketPoints(points, "all").map((point) => point.period)).toEqual([
      "2021",
      "2022",
    ]);
  });
});
