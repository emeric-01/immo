import { describe, expect, it } from "vitest";
import {
  getAubagneNearbyPreviewPrice,
  getCityPricePreviewSnapshot,
} from "./city-price-preview-data";

describe("city price SEO preview snapshot", () => {
  it("is limited to the Aubagne noindex preview", () => {
    expect(getCityPricePreviewSnapshot("aubagne")?.apartment.averagePricePerM2).toBe(2713);
    expect(getCityPricePreviewSnapshot("gemenos")).toBeNull();
  });

  it("keeps houses and apartments separate", () => {
    const snapshot = getCityPricePreviewSnapshot("aubagne");

    expect(snapshot?.house.averagePricePerM2).toBe(4720);
    expect(snapshot?.history.length).toBeGreaterThan(10);
    expect(snapshot?.salePoints[0]?.soldAt).toBe("2025-12-30");
  });

  it("provides separate nearby prices for the Aubagne preview", () => {
    expect(getAubagneNearbyPreviewPrice("gemenos")).toEqual({
      apartment: 3436,
      house: 4932,
    });
    expect(getAubagneNearbyPreviewPrice("cassis")).toBeNull();
  });
});
