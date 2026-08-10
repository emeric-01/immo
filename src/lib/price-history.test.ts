import { describe, expect, it } from "vitest";
import { buildPriceHistoryChartScale, historyDurationLabel, selectWidestCityPriceHistory } from "./price-history";

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

describe("buildPriceHistoryChartScale", () => {
  it("crée des repères lisibles pour les deux axes", () => {
    const points = Array.from({ length: 13 }, (_, index) => ({ label: String(2014 + index), value: 2520 + index * 18 }));
    const scale = buildPriceHistoryChartScale(points);

    expect(scale.xTicks).toHaveLength(5);
    expect(scale.xTicks[0]).toMatchObject({ label: "2014", xRatio: 0 });
    expect(scale.xTicks.at(-1)).toMatchObject({ label: "2026", xRatio: 1 });
    expect(scale.yTicks.length).toBeGreaterThanOrEqual(3);
    expect(scale.yMax).toBeGreaterThanOrEqual(2736);
    expect(scale.yMin).toBeLessThanOrEqual(2520);
    expect(scale.points.every((point) => point.yRatio >= 0 && point.yRatio <= 1)).toBe(true);
  });

  it("ignore les valeurs nulles qui fausseraient l’échelle", () => {
    const scale = buildPriceHistoryChartScale([
      { label: "2024", value: 0 },
      { label: "2025", value: 2600 },
      { label: "2026", value: 2800 },
    ]);

    expect(scale.points.map((point) => point.label)).toEqual(["2025", "2026"]);
    expect(scale.yMin).toBeGreaterThan(0);
  });
});
