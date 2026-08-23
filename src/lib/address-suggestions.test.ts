import { describe, expect, it } from "vitest";
import type { AddressSuggestion } from "@/lib/immo-data";
import {
  getExplicitExternalLocationSuggestions,
  prioritizeAddressSuggestions,
} from "@/lib/address-suggestions";

function suggestion(
  label: string,
  cityName: string,
  inseeCode: string,
  postCode: string,
): AddressSuggestion {
  return {
    cityName,
    inseeCode,
    label,
    latitude: 0,
    longitude: 0,
    postCode: [postCode],
  };
}

describe("address suggestion priorities", () => {
  const aubagne = suggestion("8 Rue Jean Mermoz 13400 Aubagne", "Aubagne", "13005", "13400");
  const calais = suggestion("8 Rue Jean du Buffet 62100 Calais", "Calais", "62193", "62100");

  it("keeps the page city first for an ambiguous query", () => {
    expect(prioritizeAddressSuggestions([aubagne], [calais], "13005")[0]).toEqual(aubagne);
  });

  it("keeps the broad API order when another city is explicit", () => {
    expect(prioritizeAddressSuggestions([aubagne], [calais], "13005", false)[0]).toEqual(calais);
  });

  it("filters results to the explicitly requested external city", () => {
    const clisson = suggestion("8 Rue du Buffet 44190 Clisson", "Clisson", "44043", "44190");

    expect(getExplicitExternalLocationSuggestions("8 rue jean du buffet 62100", [calais, clisson], "13005"))
      .toEqual([calais]);
    expect(getExplicitExternalLocationSuggestions("8 rue jean du buffet Calais", [calais, clisson], "13005"))
      .toEqual([calais]);
    expect(getExplicitExternalLocationSuggestions("8 rue jean mermoz", [calais, clisson], "13005"))
      .toEqual([]);
  });
});
