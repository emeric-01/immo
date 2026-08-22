import { describe, expect, it } from "vitest";
import {
  getLocalAgencyNeighborhoodProfile,
  LOCAL_AGENCY_NEIGHBORHOOD_PREVIEW_SLUGS,
} from "./local-agency-neighborhoods";

const expectedSlugs = [
  "aubagne",
  "gemenos",
  "la-ciotat",
  "cassis",
  "aix-en-provence",
  "saint-cyr-sur-mer",
];

describe("local agency neighborhood previews", () => {
  it("covers the six priority cities", () => {
    expect([...LOCAL_AGENCY_NEIGHBORHOOD_PREVIEW_SLUGS].sort()).toEqual([...expectedSlugs].sort());
  });

  it.each(expectedSlugs)("keeps %s concise, sourced and unique", (slug) => {
    const profile = getLocalAgencyNeighborhoodProfile(slug);

    expect(profile).not.toBeNull();
    expect(profile?.neighborhoods.length).toBeGreaterThanOrEqual(4);
    expect(profile?.neighborhoods.length).toBeLessThanOrEqual(6);
    expect(new Set(profile?.neighborhoods.map((item) => item.title)).size).toBe(
      profile?.neighborhoods.length,
    );
    expect(profile?.neighborhoods.every((item) => item.description.length >= 120)).toBe(true);
    expect(profile?.sources.length).toBeGreaterThan(0);
    expect(profile?.sources.every((source) => source.href.startsWith("https://"))).toBe(true);
  });
});
