// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import type { CityMarketData } from "@/lib/city-market-data";
import type { Property } from "@/lib/properties";

vi.mock("server-only", () => ({}));
import { calculatePropertyMarketScore } from "@/lib/property-market-score";

const property = { property_type: "apartment", price: 300_000, surface_m2: 75 } as Property;
const market = {
  updatedAt: "2026-07-01",
  apartment: { averagePricePerM2: 4_000, lowPricePerM2: 3_000, highPricePerM2: 5_200 },
  house: { averagePricePerM2: 5_000, lowPricePerM2: 3_800, highPricePerM2: 6_500 },
  salePoints: [
    { propertyType: "Appartement", rooms: 3, surfaceM2: 72, pricePerM2: 3_950 },
    { propertyType: "Appartement", rooms: 3, surfaceM2: 80, pricePerM2: 4_050 },
    { propertyType: "Maison", rooms: 5, surfaceM2: 118, pricePerM2: 4_900 },
    { propertyType: "Maison", rooms: 5, surfaceM2: 126, pricePerM2: 5_100 },
  ],
} as CityMarketData;

describe("property market score", () => {
  it("scores a listing aligned with comparable DVF sales", () => {
    const score = calculatePropertyMarketScore(property, market);
    expect(score?.score).toBe(100);
    expect(score?.status).toBe("coherent");
    expect(score?.source).toBe("DVF + marché ville");
  });

  it("flags a significant price gap", () => {
    const score = calculatePropertyMarketScore({ ...property, price: 420_000 }, market);
    expect(score?.status).toBe("high-gap");
    expect(score?.gapPercent).toBeGreaterThan(30);
  });

  it("uses only comparables matching the property typology", () => {
    const house = { ...property, property_type: "house", price: 600_000, surface_m2: 120, rooms: 5 } as Property;
    const score = calculatePropertyMarketScore(house, market);
    expect(score?.propertyTypeLabel).toBe("Maison");
    expect(score?.referencePricePerM2).toBe(5_000);
    expect(score?.comparableCount).toBe(2);
  });

  it("moves the justified range upward for premium amenities", () => {
    const standard = calculatePropertyMarketScore({ ...property, amenities: [], property_condition: "Bon état" } as Property, market);
    const premium = calculatePropertyMarketScore({
      ...property,
      amenities: ["Terrasse", "Parking", "Vue mer", "Climatisation"],
      property_condition: "Excellent état",
      energy_rating: "B",
      exposure: "Sud-Ouest",
    } as Property, market);
    expect(premium?.qualityAdjustmentPercent).toBeGreaterThan(standard?.qualityAdjustmentPercent ?? 0);
    expect(premium?.rangeLowPerM2).toBeGreaterThan(standard?.rangeLowPerM2 ?? 0);
    expect(premium?.qualityFactors).toContain("Vue mer +8%");
  });

  it("moves the range downward for a property requiring renovation", () => {
    const score = calculatePropertyMarketScore({ ...property, amenities: [], property_condition: "À rénover", energy_rating: "G" } as Property, market);
    expect(score?.qualityAdjustmentPercent).toBe(-18);
    expect(score?.referencePricePerM2).toBeLessThan(4_000);
  });
});
