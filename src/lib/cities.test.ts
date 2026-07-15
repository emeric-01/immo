import { describe, expect, it } from "vitest";
import { getCityByMarketIdentifier, getCityBySlug, getNearbyCities } from "./cities";

const addedCities = [
  ["ceyreste", "13023"],
  ["cassis", "13022"],
  ["roquefort-la-bedoule", "13085"],
  ["saint-cyr-sur-mer", "83112"],
  ["carnoux-en-provence", "13119"],
  ["auriol", "13007"],
  ["cuges-les-pins", "13030"],
  ["la-penne-sur-huveaune", "13070"],
] as const;

describe("city price pages", () => {
  it.each(addedCities)("registers %s with INSEE code %s", (slug, inseeCode) => {
    expect(getCityBySlug(slug)?.inseeCode).toBe(inseeCode);
    expect(getCityByMarketIdentifier({ inseeCode })?.slug).toBe(slug);
  });

  it.each(addedCities)("only references configured neighbors for %s", (slug) => {
    const city = getCityBySlug(slug);

    expect(city).toBeDefined();
    expect(getNearbyCities(city!)).toHaveLength(city!.nearbySlugs.length);
  });
});
