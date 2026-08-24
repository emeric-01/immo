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

  it("keeps unknown years visible instead of silently changing the start date", () => {
    const points = prepareCityPriceHistoryForDisplay([
      { apartment: 0, house: 0, period: "2014" },
      { apartment: 0, house: 0, period: "2020" },
      { apartment: 4_100, house: 5_200, period: "2021" },
      { apartment: 4_200, house: 5_300, period: "2022" },
    ]);

    expect(filterCityMarketPoints(points, "all").map((point) => point.period)).toEqual([
      "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022",
    ]);
  });

  it("keeps the hybrid history since 2014 while limiting the recent view to DVF years", () => {
    const hybridHistory = prepareCityPriceHistoryForDisplay([
      { apartment: 2_900, house: 3_700, period: "2014" },
      { apartment: 3_200, house: 4_300, period: "2020" },
      { apartment: 3_800, house: 4_900, period: "2021" },
      { apartment: 4_000, house: 5_100, period: "2022" },
      { apartment: 4_100, house: 5_200, period: "2023" },
      { apartment: 4_050, house: 5_150, period: "2024" },
      { apartment: 4_200, house: 5_300, period: "2025" },
    ]);

    expect(filterCityMarketPoints(hybridHistory, "all")[0]?.period).toBe("2014");
    expect(filterCityMarketPoints(hybridHistory, "5y").map((point) => point.period)).toEqual([
      "2021",
      "2022",
      "2023",
      "2024",
      "2025",
    ]);
  });
});
