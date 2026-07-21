// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import type { CityMarketData } from "@/lib/city-market-data";
import type { Property } from "@/lib/properties";

vi.mock("server-only", () => ({}));
import { calculatePropertyMarketScore } from "@/lib/property-market-score";

const property = { property_type: "apartment", price: 300_000, surface_m2: 75 } as Property;
const market = {
  updatedAt: "2026-07-01", apartment: { averagePricePerM2: 4_000 }, house: { averagePricePerM2: 5_000 },
  salePoints: [{ propertyType: "Appartement", surfaceM2: 72, pricePerM2: 3_950 }, { propertyType: "Appartement", surfaceM2: 80, pricePerM2: 4_050 }],
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
});
