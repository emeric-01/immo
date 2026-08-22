// @vitest-environment node
import { describe, expect, it } from "vitest";
import { getCityBySlug } from "./cities";
import { getStaticCityMarketData } from "./city-market-data";
import type { InseeHousingProfile } from "./insee-housing";
import { createCityLocalMarketInsight } from "./city-local-insights";

function city(slug: string) {
  const value = getCityBySlug(slug);
  if (!value) throw new Error(`Ville inconnue : ${slug}`);
  return value;
}

const profile: InseeHousingProfile = {
  cityName: "Gémenos",
  inseeCode: "13042",
  vintage: 2023,
  sourceUrl: "https://www.insee.fr/fr/statistiques/5359146",
  totalHousing: 3_200,
  housingTypes: [{ label: "Maisons", value: 2_240 }, { label: "Appartements", value: 960 }],
  occupancy: [
    { label: "Résidences principales", value: 2_800 },
    { label: "Résidences secondaires", value: 160 },
    { label: "Logements vacants", value: 240 },
  ],
  tenure: [{ label: "Propriétaires", value: 2_000 }, { label: "Locataires", value: 800 }],
  rooms: [], surfaces: [], construction: [], moveIn: [],
  demographics: {
    population: 6_700,
    population2017: 6_300,
    change2017To2023Percent: 6.3,
    under20Share: 24.5,
    age65PlusShare: 21,
  },
};

describe("createCityLocalMarketInsight", () => {
  it("crosses demographic, housing and price data without claiming causality", () => {
    const gemenos = city("gemenos");
    const insight = createCityLocalMarketInsight(
      gemenos,
      getStaticCityMarketData(gemenos),
      profile,
    );

    expect(insight?.dominantHousing).toEqual({ label: "maisons", share: 70 });
    expect(insight?.summary).toContain("selon les derniers chiffres publiés par l’INSEE");
    expect(insight?.summary).toContain("progression de 6,3 %");
    expect(insight?.signals[0]?.description).toContain("€/m²");
    expect(insight?.summary).toContain("ne déterminent jamais à eux seuls");
    expect(insight?.signals.map((signal) => signal.description).join(" ")).toContain(
      "sans constituer, à lui seul, un facteur de prix",
    );
  });

  it("does not publish a portrait when demographic data is absent", () => {
    const gemenos = city("gemenos");
    expect(createCityLocalMarketInsight(gemenos, null, { ...profile, demographics: undefined })).toBeNull();
  });
});
