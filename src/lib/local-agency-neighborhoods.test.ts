import { describe, expect, it } from "vitest";
import { localMarketCities } from "./cities";
import {
  getLocalAgencyNeighborhoodProfile,
  LOCAL_AGENCY_NEIGHBORHOOD_PREVIEW_SLUGS,
} from "./local-agency-neighborhoods";

const expectedSlugs = localMarketCities.map((city) => city.slug);

describe("local agency neighborhood previews", () => {
  it("covers every local agency city in Bouches-du-Rhône and Var", () => {
    expect([...LOCAL_AGENCY_NEIGHBORHOOD_PREVIEW_SLUGS].sort()).toEqual([...expectedSlugs].sort());
  });

  it.each(expectedSlugs)("keeps %s concise, sourced and unique", (slug) => {
    const profile = getLocalAgencyNeighborhoodProfile(slug);

    expect(profile).not.toBeNull();
    expect(profile?.neighborhoods.length).toBeGreaterThanOrEqual(1);
    expect(profile?.neighborhoods.length).toBeLessThanOrEqual(6);
    expect(new Set(profile?.neighborhoods.map((item) => item.title)).size).toBe(
      profile?.neighborhoods.length,
    );
    expect(profile?.neighborhoods.every((item) => item.description.length >= 120)).toBe(true);
    expect(
      profile?.neighborhoods.every((item) =>
        !item.codes || item.codes.every((code) => /^\d{9}$/.test(code)),
      ),
    ).toBe(true);
    expect(profile?.sources.length).toBeGreaterThan(0);
    expect(profile?.sources.every((source) => source.href.startsWith("https://"))).toBe(true);
  });

  it("keeps audited INSEE display labels for Aubagne", () => {
    const titles = getLocalAgencyNeighborhoodProfile("aubagne")?.neighborhoods.map(
      (neighborhood) => neighborhood.title,
    );

    expect(titles).toEqual(expect.arrayContaining([
      "Garlaban-Royante",
      "Arnaud Solans",
      "Gavots",
    ]));
  });
});
