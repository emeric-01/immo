import { describe, expect, it } from "vitest";
import { getCityBySlug } from "./cities";
import { getStoredCityMarketTrend } from "./stored-city-market-trends";

function trendFor(slug: string) {
  const city = getCityBySlug(slug);

  if (!city) {
    throw new Error(`Unknown city: ${slug}`);
  }

  return getStoredCityMarketTrend(city);
}

describe("stored city market trends", () => {
  it("uses the latest trends persisted by the back-office", () => {
    expect(trendFor("aix-en-provence")).toBe(-1.1);
    expect(trendFor("aubagne")).toBe(-0.3);
    expect(trendFor("auriol")).toBe(0.5);
    expect(trendFor("cuges-les-pins")).toBe(-3.2);
    expect(trendFor("gemenos")).toBe(-0.2);
    expect(trendFor("toulon")).toBe(-0.1);
  });

  it("does not invent a trend when the back-office has no snapshot", () => {
    expect(trendFor("cassis")).toBeNull();
    expect(trendFor("bandol")).toBeNull();
  });
});
