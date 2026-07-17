import { describe, expect, it } from "vitest";
import { getCityByMarketIdentifier, getCityBySlug, getNearbyCities } from "./cities";

const addedCities = [
  ["la-ciotat", "13028"],
  ["allauch", "13002"],
  ["gardanne", "13041"],
  ["bouc-bel-air", "13015"],
  ["roquevaire", "13086"],
  ["la-destrousse", "13031"],
  ["cadolive", "13020"],
  ["saint-savournin", "13101"],
  ["belcodene", "13013"],
  ["mimet", "13062"],
  ["simiane-collongue", "13107"],
  ["la-bouilladisse", "13016"],
  ["peypin", "13073"],
  ["plan-de-cuques", "13075"],
  ["marseille-11e", "13211"],
  ["marseille-12e", "13212"],
  ["ceyreste", "13023"],
  ["cassis", "13022"],
  ["roquefort-la-bedoule", "13085"],
  ["saint-cyr-sur-mer", "83112"],
  ["carnoux-en-provence", "13119"],
  ["auriol", "13007"],
  ["cuges-les-pins", "13030"],
  ["la-penne-sur-huveaune", "13070"],
  ["la-cadiere-d-azur", "83027"],
  ["le-castellet", "83035"],
  ["bandol", "83009"],
  ["le-beausset", "83016"],
  ["sanary-sur-mer", "83123"],
  ["evenos", "83053"],
  ["ollioules", "83090"],
  ["signes", "83127"],
  ["six-fours-les-plages", "83129"],
  ["la-seyne-sur-mer", "83126"],
  ["toulon", "83137"],
  ["la-valette-du-var", "83144"],
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
