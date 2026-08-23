import { describe, expect, it } from "vitest";
import {
  calculateTrend,
  confidenceForCount,
  pointInGeometry,
  reliabilityForCount,
  summarizeSales,
} from "./market-statistics.mjs";

describe("DVF market statistics", () => {
  it("publishes a median and quartiles from comparable sales", () => {
    const summary = summarizeSales([2_000, 2_500, 3_000, 3_500, 4_000].map((pricePerM2) => ({ pricePerM2 })));

    expect(summary).toMatchObject({
      medianPricePerM2: 3_000,
      observations: 5,
      p25PricePerM2: 2_500,
      p75PricePerM2: 3_500,
      reliability: "exploratory",
    });
  });

  it("does not invent a neighborhood price below three observations", () => {
    expect(summarizeSales([{ pricePerM2: 3_000 }, { pricePerM2: 3_200 }])).toMatchObject({
      medianPricePerM2: null,
      observations: 2,
      reliability: "insufficient",
    });
  });

  it("uses stable confidence thresholds", () => {
    expect(reliabilityForCount(15)).toBe("robust");
    expect(reliabilityForCount(8)).toBe("indicative");
    expect(confidenceForCount(100)).toBe(5);
    expect(confidenceForCount(15)).toBe(4);
  });

  it("calculates the annual price trend", () => {
    expect(calculateTrend(2_706, 2_631)).toBe(-2.8);
  });

  it("assigns a sale to an IRIS polygon", () => {
    const geometry = {
      type: "Polygon",
      coordinates: [[[5, 43], [6, 43], [6, 44], [5, 44], [5, 43]]],
    };

    expect(pointInGeometry([5.5, 43.5], geometry)).toBe(true);
    expect(pointInGeometry([7, 43.5], geometry)).toBe(false);
  });
});
