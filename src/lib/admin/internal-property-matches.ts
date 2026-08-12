import "server-only";

import type { AdminBuyerSearchRow } from "@/lib/admin/buyer-searches";
import { INTERKAB_CITIES, getAllStoredInterkabListings } from "@/lib/interkab";
import { adminRest } from "@/lib/properties";
import { rankPropertyMatches, type InternalMatchCandidate } from "./search-property-matching";

type AgencyPropertyRow = {
  bathrooms: number | null; bedrooms: number | null; city_name: string; id: string;
  land_area_m2: number | null; price: number; property_type: string; rooms: number | null;
  slug: string; surface_m2: number | null; title: string;
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export async function getInternalPropertyMatches(search: AdminBuyerSearchRow) {
  const selectedCities = INTERKAB_CITIES.filter((city) =>
    search.city_names.some((name) => normalize(name) === normalize(city.name)),
  );
  const [agencyRows, interkabGroups] = await Promise.all([
    adminRest<AgencyPropertyRow[]>("properties?status=eq.published&select=id,slug,title,city_name,property_type,price,surface_m2,rooms,bedrooms,bathrooms,land_area_m2&order=updated_at.desc"),
    Promise.all(selectedCities.map((city) => getAllStoredInterkabListings({ inseeCode: city.inseeCode }))),
  ]);

  const agencyCandidates: InternalMatchCandidate[] = agencyRows.map((property) => ({
    bathrooms: property.bathrooms, bedrooms: property.bedrooms, city: property.city_name,
    id: property.id, landAreaM2: property.land_area_m2, price: property.price,
    propertyType: property.property_type, rooms: property.rooms, source: "agency",
    surfaceM2: property.surface_m2, title: property.title, url: `/admin/biens/${property.id}`,
  }));
  const interkabCandidates: InternalMatchCandidate[] = interkabGroups.flat().map((listing) => ({
    bathrooms: listing.bathrooms, bedrooms: listing.bedrooms, city: listing.city,
    id: listing.externalId, landAreaM2: listing.landAreaM2, price: listing.price,
    propertyType: listing.propertyType, rooms: listing.rooms, source: "interkab",
    surfaceM2: listing.surfaceM2, title: `${listing.propertyType} à ${listing.city}`,
    url: listing.listingUrl,
  }));

  return {
    agency: rankPropertyMatches(agencyCandidates, search).slice(0, 12),
    interkab: rankPropertyMatches(interkabCandidates, search).slice(0, 24),
  };
}
