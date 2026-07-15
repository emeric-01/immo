import { describe, expect, it } from "vitest";
import { getCityByMarketIdentifier } from "./cities";

describe("getCityByMarketIdentifier", () => {
  it("finds a city page from its INSEE code", () => {
    expect(getCityByMarketIdentifier({ inseeCode: "13005" })?.slug).toBe("aubagne");
  });

  it("matches city names without accents", () => {
    expect(getCityByMarketIdentifier({ name: "Gémenos" })?.slug).toBe("gemenos");
  });

  it("does not invent a page for an unsupported city", () => {
    expect(getCityByMarketIdentifier({ name: "Cuges-les-Pins" })).toBeUndefined();
  });
});
