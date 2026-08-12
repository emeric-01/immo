import { describe, expect, it } from "vitest";
import { matchPropertyToSearch } from "./search-property-matching";

const search = { city_names: ["Aubagne"], property_types: ["apartment"], maximum_budget: 300000, minimum_living_area: 60, minimum_rooms: 3, minimum_bedrooms: 2, minimum_bathrooms: null, minimum_land_area: null } as never;
const candidate = { id: "1", source: "interkab", title: "Appartement", url: "#", city: "Aubagne", propertyType: "Appartement", price: 300000, surfaceM2: 65, rooms: 3, bedrooms: 2, bathrooms: null, landAreaM2: null } as const;

describe("internal property matching", () => {
  it("classifies a strict match", () => expect(matchPropertyToSearch(candidate, search)?.tier).toBe("strict"));
  it("allows a five percent negotiation", () => expect(matchPropertyToSearch({ ...candidate, price: 315000 }, search)?.tier).toBe("negotiation"));
  it("allows an eight percent expanded opportunity", () => expect(matchPropertyToSearch({ ...candidate, price: 324000 }, search)?.tier).toBe("expanded"));
  it("rejects a property above eight percent", () => expect(matchPropertyToSearch({ ...candidate, price: 324001 }, search)).toBeNull());
  it("rejects a different city", () => expect(matchPropertyToSearch({ ...candidate, city: "Toulon" }, search)).toBeNull());
});
