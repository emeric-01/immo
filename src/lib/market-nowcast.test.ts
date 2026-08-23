import { describe, expect, it } from "vitest";
import { buildMarketNowcast, type MarketNowcastListing } from "./market-nowcast";

function listing(id: string, price: number, surfaceM2: number, propertyType = "Appartement"): MarketNowcastListing {
  return { externalId: id, price, propertyType, surfaceM2, rooms: 3, neighborhood: "Centre" };
}

describe("market nowcast", () => {
  it("keeps asking prices separate and dampens their effect on the DVF anchor", () => {
    const listings = Array.from({ length: 30 }, (_, index) => ({
      ...listing(String(index), 210_000 + index * 100, 70),
      neighborhood: `Secteur ${index}`,
    }));
    const result = buildMarketNowcast(listings, "apartment", 2_700);

    expect(result).toMatchObject({
      askingMedianPricePerM2: 3_021,
      confidencePercent: 50,
      dvfMedianPricePerM2: 2_700,
      listingCount: 30,
      nowcastAdjustmentPercent: 3.6,
      nowcastPricePerM2: 2_796,
    });
  });

  it("excludes atypical properties and exact professional duplicates", () => {
    const result = buildMarketNowcast([
      listing("one", 210_000, 70),
      listing("duplicate", 210_000, 70),
      listing("viager", 180_000, 70, "Appartement en viager"),
      listing("house", 450_000, 110, "Maison"),
    ], "apartment", 2_700);

    expect(result).toMatchObject({ excludedCount: 3, listingCount: 1, sourceCount: 4 });
    expect(result?.nowcastPricePerM2).toBeNull();
  });
});
