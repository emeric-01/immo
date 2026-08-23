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

  it("uses the seven Aubagne grand quarters with verified neighborhood labels", () => {
    const zones = getCityPricePreviewSnapshot("aubagne")?.zones ?? [];

    expect(zones).toHaveLength(7);
    expect(zones.map((zone) => zone.id)).toEqual([
      "1300501", "1300502", "1300503", "1300504", "1300505", "1300506", "1300507",
    ]);
    expect(zones.some((zone) => zone.name.includes("Grand Quartier"))).toBe(false);
    expect(zones[0]).toMatchObject({
      name: "Centre-ville et Beaumond",
      includedNeighborhoods: ["Beaumond", "Centre Ville"],
    });
    expect(zones[6]?.includedNeighborhoods).toContain("Napollon");
    expect(zones.every((zone) => zone.polygon.length >= 3)).toBe(true);
  });

  it("provides separate nearby prices for the Aubagne preview", () => {
    expect(getAubagneNearbyPreviewPrice("gemenos")).toEqual({
      apartment: 3436,
      house: 4932,
    });
    expect(getAubagneNearbyPreviewPrice("cassis")).toBeNull();
  });
});
