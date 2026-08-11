import { describe, expect, it } from "vitest";
import { scoreInterkabListing } from "./interkab-scoring";

describe("Interkab listing scoring", () => {
  it("combines buyer compatibility and market positioning", () => {
    const listing = { city: "Aubagne", propertyType: "Appartement", price: 240000, surfaceM2: 70, rooms: 3, bedrooms: 2, landAreaM2: null } as never;
    const search = { id: "search-1", city_names: ["Aubagne"], property_types: ["apartment"], maximum_budget: 260000, minimum_living_area: 65, minimum_rooms: 3, minimum_bedrooms: 2, minimum_land_area: null, status: "qualified", contact_first_name: "Julie", contact_last_name: "Martin" } as never;
    const market = { apartment: { averagePricePerM2: 3750 }, house: { averagePricePerM2: 3900 } } as never;
    const score = scoreInterkabListing(listing, [search], market);
    expect(score.compatibleSearchCount).toBe(1);
    expect(score.bestBuyerMatch?.score).toBe(100);
    expect(score.pricePerM2).toBe(3429);
    expect(score.interestScore).toBeGreaterThanOrEqual(90);
  });
});
