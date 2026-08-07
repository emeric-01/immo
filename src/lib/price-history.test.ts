import { describe, expect, it } from "vitest";
import { historyDurationLabel, selectWidestCityPriceHistory } from "./price-history";

describe("selectWidestCityPriceHistory", () => {
  it("préfère la série qui remonte le plus loin même si elle a moins de points", () => {
    const recentMonthly = Array.from({ length: 12 }, (_, index) => ({ period: `2025-${String(index + 1).padStart(2, "0")}`, apartment: 3000 + index, house: 3500 + index }));
    const longAnnual = Array.from({ length: 10 }, (_, index) => ({ period: String(2015 + index), apartment: 2500 + index * 100, house: 2900 + index * 100 }));

    expect(selectWidestCityPriceHistory(recentMonthly, longAnnual)[0].period).toBe("2015");
  });

  it("trie les périodes et élimine les valeurs inexploitables", () => {
    const history = selectWidestCityPriceHistory([
      { period: "2024", apartment: 3100, house: 3600 },
      { period: "2022", apartment: 2900, house: 3400 },
      { period: "2023", apartment: 0, house: 0 },
    ]);

    expect(history.map(({ period }) => period)).toEqual(["2022", "2024"]);
  });
});

describe("historyDurationLabel", () => {
  it("présente clairement le recul disponible", () => {
    expect(historyDurationLabel("2014-01", "2026-07")).toBe("12,5 ans d’historique");
  });
});
