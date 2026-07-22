import { describe, expect, it } from "vitest";
import type { AddressSuggestion } from "@/lib/immo-data";
import { prioritizeAddressSuggestions } from "./prioritize-address-suggestions";

function suggestion(
  label: string,
  inseeCode: string,
  longitude: number,
): AddressSuggestion {
  return {
    cityName: inseeCode === "13001" ? "Aix-en-Provence" : "Gardanne",
    inseeCode,
    label,
    latitude: 43.5,
    longitude,
  };
}

describe("prioritizeAddressSuggestions", () => {
  it("keeps neighboring cities while ranking the page city first", () => {
    const aix = suggestion("12 rue locale, Aix-en-Provence", "13001", 5.44);
    const gardanne = suggestion("12 rue voisine, Gardanne", "13041", 5.47);

    expect(prioritizeAddressSuggestions([aix], [gardanne], "13001"))
      .toEqual([aix, gardanne]);
  });

  it("removes duplicate suggestions returned by both searches", () => {
    const aix = {
      ...suggestion("12 rue locale, Aix-en-Provence", "13001", 5.44),
      addressId: "ban-aix-12",
    };

    expect(prioritizeAddressSuggestions([aix], [aix], "13001"))
      .toEqual([aix]);
  });
});
