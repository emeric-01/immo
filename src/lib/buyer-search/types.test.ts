import { describe, expect, it } from "vitest";
import { defaultBuyerSearchData } from "./types";

describe("default buyer search", () => {
  it("starts without any preselected answer", () => {
    expect(defaultBuyerSearchData.location.cities).toEqual([]);
    expect(defaultBuyerSearchData.location.radiusKm).toBeNull();
    expect(defaultBuyerSearchData.property).toEqual({
      idealBudget: null,
      maximumBudget: null,
      type: null,
      types: [],
    });
    expect(defaultBuyerSearchData.characteristics).toEqual({
      minimumBathrooms: 0,
      minimumBedrooms: 0,
      minimumLivingArea: null,
      minimumRooms: 0,
    });
    expect(defaultBuyerSearchData.project).toEqual({
      currentSituation: null,
      financingStatus: null,
      purchaseTimeline: null,
    });
    expect(defaultBuyerSearchData.contact.preferredChannel).toBeNull();
    expect(defaultBuyerSearchData.contact.consent).toBe(false);
  });
});
