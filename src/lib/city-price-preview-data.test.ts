import { describe, expect, it } from "vitest";
import {
  getAubagneNearbyPreviewPrice,
  getCityPricePreviewSnapshot,
} from "./city-price-preview-data";
import { getNamedAubagnePreviewZones } from "./aubagne-preview-zones";
import {
  aubagneDvfAudit,
  aubagneDvfPreviewZones,
} from "./aubagne-dvf-preview-data";

describe("city price SEO preview snapshot", () => {
  it("is limited to the Aubagne noindex preview", () => {
    expect(getCityPricePreviewSnapshot("aubagne")?.apartment).toMatchObject({
      averagePricePerM2: 2744,
      lowPricePerM2: 2268,
      highPricePerM2: 3298,
    });
    expect(getCityPricePreviewSnapshot("gemenos")).toBeNull();
  });

  it("keeps houses and apartments separate", () => {
    const snapshot = getCityPricePreviewSnapshot("aubagne");

    expect(snapshot?.source).toBe("dvf");
    expect(snapshot?.house).toMatchObject({
      averagePricePerM2: 4479,
      lowPricePerM2: 3598,
      highPricePerM2: 5373,
    });
    expect(snapshot?.history).toHaveLength(12);
    expect(snapshot?.history.at(0)).toMatchObject({ period: "2014" });
    expect(snapshot?.history.at(-1)).toMatchObject({ period: "2025" });
    expect(snapshot?.transactionCount).toBe(2573);
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

  it("renames live Aubagne zones without replacing their market values", () => {
    const zones = getNamedAubagnePreviewZones([{
      id: "1300502",
      name: "Grand Quartier 2",
      pricePerM2: 2999,
      color: "#fff",
      polygon: [[5.5, 43.2], [5.6, 43.2], [5.6, 43.3]],
    }]);

    expect(zones[0]).toMatchObject({
      mapLabel: "Passons\nVerdun",
      name: "Passons et Verdun",
      pricePerM2: 2999,
      includedNeighborhoods: ["Passons", "Verdun"],
    });
  });

  it("provides separate nearby prices for the Aubagne preview", () => {
    expect(getAubagneNearbyPreviewPrice("gemenos")).toEqual({
      apartment: 4184,
      house: 5496,
    });
    expect(getAubagneNearbyPreviewPrice("cassis")).toBeNull();
  });

  it("covers the 20 official Aubagne IRIS with unique codes and usable polygons", () => {
    expect(aubagneDvfPreviewZones).toHaveLength(20);
    expect(new Set(aubagneDvfPreviewZones.map((zone) => zone.code)).size).toBe(20);
    expect(aubagneDvfPreviewZones.every((zone) => zone.code.startsWith("13005"))).toBe(true);
    expect(aubagneDvfPreviewZones.every((zone) => zone.polygon.length >= 3)).toBe(true);
  });

  it("separates apartment and house medians and labels small samples", () => {
    const arnaudSolans = aubagneDvfPreviewZones.find((zone) => zone.name === "Arnaud Solans");
    const charrel = aubagneDvfPreviewZones.find((zone) => zone.name === "Charrel");
    const garlaban = aubagneDvfPreviewZones.find((zone) => zone.name === "Garlaban-Royante");

    expect(arnaudSolans?.apartment).toMatchObject({
      observations: 27,
      medianPricePerM2: 4511,
      reliability: "robust",
    });
    expect(arnaudSolans?.house).toMatchObject({
      observations: 92,
      medianPricePerM2: 4765,
      reliability: "robust",
    });
    expect(charrel?.apartment).toMatchObject({
      observations: 2,
      medianPricePerM2: null,
      reliability: "insufficient",
    });
    expect(charrel?.house.medianPricePerM2).toBeNull();
    expect(garlaban?.apartment).toMatchObject({
      observations: 3,
      medianPricePerM2: 3364,
      reliability: "exploratory",
    });
  });

  it("exposes the DVF audit trail used by the preview", () => {
    expect(aubagneDvfAudit).toMatchObject({
      observedPeriod: "2021–2025",
      rawRows: 10366,
      uniqueMutations: 4069,
      comparableSales: 2332,
      mixedPropertyMutationsExcluded: 263,
    });
    expect(aubagneDvfAudit.uniqueMutations + aubagneDvfAudit.groupedRows).toBe(aubagneDvfAudit.rawRows);
  });
});
