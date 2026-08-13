import { describe, expect, it } from "vitest";
import { distanceInKm, findCandidateSearchArea, interkabAsideReason, matchPropertyToSearch } from "./search-property-matching";

const search = { city_names: ["Aubagne"], property_types: ["apartment"], maximum_budget: 300000, minimum_living_area: 60, minimum_rooms: 3, minimum_bedrooms: 2, minimum_bathrooms: null, minimum_land_area: null } as never;
const candidate = { id: "1", source: "interkab", title: "Appartement", url: "#", city: "Aubagne", propertyType: "Appartement", price: 300000, surfaceM2: 65, rooms: 3, bedrooms: 2, bathrooms: null, landAreaM2: null } as const;

describe("internal property matching", () => {
  it("classifies a strict match", () => expect(matchPropertyToSearch(candidate, search)?.tier).toBe("strict"));
  it("allows a five percent negotiation", () => expect(matchPropertyToSearch({ ...candidate, price: 315000 }, search)?.tier).toBe("negotiation"));
  it("allows an eight percent expanded opportunity", () => expect(matchPropertyToSearch({ ...candidate, price: 324000 }, search)?.tier).toBe("expanded"));
  it("rejects a property above eight percent", () => expect(matchPropertyToSearch({ ...candidate, price: 324001 }, search)).toBeNull());
  it("rejects a different city", () => expect(matchPropertyToSearch({ ...candidate, city: "Toulon" }, search)).toBeNull());
  it.each(["Terrain à bâtir", "Viager appartement", "Garage", "Parking", "Cave", "Immeuble", "Autre", "Marina"])(
    "excludes non-residential Interkab category %s",
    (propertyType) => expect(matchPropertyToSearch({ ...candidate, propertyType }, search)).toBeNull(),
  );
  it.each([
    ["Terrain à bâtir", "Terrain non demandé pour cette recherche"],
    ["Parking", "Annexe vendue seule, hors critères"],
    ["Viager appartement", "Vente en viager non demandée"],
  ])("explains why %s is set aside", (propertyType, reason) => {
    expect(interkabAsideReason(propertyType)).toBe(reason);
  });
  it.each([["Maison de village", "house"], ["Bastide", "house"], ["Rez de jardin", "apartment"], ["Triplex", "apartment"]] as const)(
    "keeps residential Interkab category %s",
    (propertyType, expectedType) => expect(matchPropertyToSearch({ ...candidate, propertyType }, {
      city_names: ["Aubagne"], property_types: [expectedType], maximum_budget: 300000,
      minimum_living_area: 60, minimum_rooms: 3, minimum_bedrooms: 2,
      minimum_bathrooms: null, minimum_land_area: null,
    } as never)).not.toBeNull(),
  );
  it("includes a neighboring city within the selected radius", () => {
    const area = findCandidateSearchArea(
      { ...candidate, city: "Gémenos", latitude: 43.2989, longitude: 5.6284 },
      [{ id: 1, name: "Aubagne", latitude: 43.2928, longitude: 5.5707, radiusKm: 5 }],
    );
    expect(area?.name).toBe("Aubagne");
    expect(area?.distanceKm).toBeLessThanOrEqual(5);
  });
  it("excludes a neighboring city outside the selected radius", () => {
    expect(findCandidateSearchArea(
      { ...candidate, city: "Gémenos", latitude: 43.2989, longitude: 5.6284 },
      [{ id: 1, name: "Aubagne", latitude: 43.2928, longitude: 5.5707, radiusKm: 2 }],
    )).toBeNull();
  });
  it("assigns an overlapping property to its closest selected city", () => {
    const area = findCandidateSearchArea(
      { ...candidate, city: "La Penne-sur-Huveaune", latitude: 43.2822, longitude: 5.5164 },
      [
        { id: 1, name: "Aubagne", latitude: 43.2928, longitude: 5.5707, radiusKm: 10 },
        { id: 2, name: "Marseille", latitude: 43.2965, longitude: 5.3698, radiusKm: 20 },
      ],
    );
    expect(area?.name).toBe("Aubagne");
  });
  it("computes geographic distance in kilometers", () => {
    expect(distanceInKm(
      { latitude: 43.2928, longitude: 5.5707 },
      { latitude: 43.2989, longitude: 5.6284 },
    )).toBeGreaterThan(4);
  });
});
