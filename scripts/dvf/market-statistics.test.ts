import { describe, expect, it } from "vitest";
import {
  calculateTrend,
  buildAnnualPriceHistory,
  confidenceForCount,
  inspectHistoryCoverage,
  mergeStoredAndDvfHistory,
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

  it("does not create zero-price years when the source has no comparable sales", () => {
    const sales = [
      ...[3_000, 3_100, 3_200].map((pricePerM2) => ({ pricePerM2, propertyType: "apartment", sourceYear: 2021 })),
      ...[4_000, 4_100, 4_200].map((pricePerM2) => ({ pricePerM2, propertyType: "house", sourceYear: 2021 })),
    ];

    expect(buildAnnualPriceHistory(sales, [2014, 2020, 2021])).toEqual([{
      apartment: 3_100,
      apartmentCount: 3,
      house: 4_100,
      houseCount: 3,
      period: "2021",
    }]);
  });

  it("uses stored Immo Data before 2021 and only to fill a missing DVF typology afterward", () => {
    const stored = [
      { apartment: 2_900, house: 3_700, period: "2014-01" },
      { apartment: 3_100, house: 3_900, period: "2014-12" },
      { apartment: 3_200, house: 4_300, period: "2020-12" },
      { apartment: 3_300, house: 4_400, period: "2021-01" },
      { apartment: 3_500, house: 4_600, period: "2022-12" },
    ];
    const dvf = [
      { apartment: 3_800, house: 4_900, period: "2021" },
      { apartment: 0, house: 5_100, period: "2022" },
    ];

    expect(mergeStoredAndDvfHistory(stored, dvf, 2021)).toEqual([
      { apartment: 3_000, apartmentSource: "immo-data", house: 3_800, houseSource: "immo-data", period: "2014" },
      { apartment: 3_200, apartmentSource: "immo-data", house: 4_300, houseSource: "immo-data", period: "2020" },
      { apartment: 3_800, apartmentSource: "dvf", house: 4_900, houseSource: "dvf", period: "2021" },
      { apartment: 3_500, apartmentSource: "immo-data", house: 5_100, houseSource: "dvf", period: "2022" },
    ]);
  });

  it("reports every missing property type instead of hiding the year", () => {
    expect(inspectHistoryCoverage([
      { apartment: 3_000, house: 4_000, period: "2014" },
      { apartment: 0, house: 4_500, period: "2016" },
    ], 2014, 2016)).toMatchObject({
      missingApartmentPeriods: ["2015", "2016"],
      missingHousePeriods: ["2015"],
      status: "partial",
    });
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
