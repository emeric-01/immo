import "server-only";

import type { AdminBuyerSearchLocation, AdminBuyerSearchRow } from "@/lib/admin/buyer-searches";
import { southCities } from "@/lib/cities";
import { INTERKAB_CITIES, getAllStoredInterkabListings } from "@/lib/interkab";
import { adminRest } from "@/lib/properties";
import {
  findCandidateSearchArea,
  rankPropertyMatches,
  type InternalMatchCandidate,
  type InternalPropertyMatch,
  type InternalSearchArea,
} from "./search-property-matching";

type AgencyPropertyRow = {
  bathrooms: number | null; bedrooms: number | null; city_name: string; id: string;
  land_area_m2: number | null; latitude: number | null; longitude: number | null; price: number; property_type: string; rooms: number | null;
  slug: string; surface_m2: number | null; title: string;
};

export type InternalPropertyMatchGroup = {
  agency: InternalPropertyMatch[];
  area: InternalSearchArea;
  interkab: InternalPropertyMatch[];
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function searchAreas(search: AdminBuyerSearchRow, locations: AdminBuyerSearchLocation[]) {
  if (locations.length) return locations.map((location) => ({
    id: location.id,
    latitude: location.latitude,
    longitude: location.longitude,
    name: location.name,
    radiusKm: Math.max(0, location.radius_km ?? 0),
  }));
  return search.city_names.map((name, index) => {
    const city = southCities.find((candidate) => normalize(candidate.name) === normalize(name));
    return { id: `legacy-${index}`, latitude: city?.latitude ?? null, longitude: city?.longitude ?? null, name, radiusKm: 0 };
  });
}

function groupMatches(matches: InternalPropertyMatch[], areas: InternalSearchArea[], limit: number) {
  return new Map(areas.map((area) => [
    String(area.id),
    matches.filter((match) => String(match.searchArea?.id) === String(area.id)).slice(0, limit),
  ]));
}

export async function getInternalPropertyMatches(search: AdminBuyerSearchRow, locations: AdminBuyerSearchLocation[]) {
  const areas = searchAreas(search, locations);
  const selectedCities = INTERKAB_CITIES.filter((city) => {
    const candidate: InternalMatchCandidate = {
      bathrooms: null, bedrooms: null, city: city.name, id: city.inseeCode, latitude: city.latitude,
      landAreaM2: null, longitude: city.longitude, price: null, propertyType: "", rooms: null,
      source: "interkab", surfaceM2: null, title: city.name, url: "",
    };
    return Boolean(findCandidateSearchArea(candidate, areas));
  });
  const [agencyRows, interkabGroups] = await Promise.all([
    adminRest<AgencyPropertyRow[]>("properties?status=eq.published&select=id,slug,title,city_name,property_type,price,surface_m2,rooms,bedrooms,bathrooms,land_area_m2,latitude,longitude&order=updated_at.desc"),
    Promise.all(selectedCities.map((city) => getAllStoredInterkabListings({ inseeCode: city.inseeCode }))),
  ]);

  const agencyCandidates: InternalMatchCandidate[] = agencyRows.map((property): InternalMatchCandidate => {
    const city = southCities.find((candidate) => normalize(candidate.name) === normalize(property.city_name));
    return {
      bathrooms: property.bathrooms, bedrooms: property.bedrooms, city: property.city_name,
      id: property.id, landAreaM2: property.land_area_m2, latitude: property.latitude ?? city?.latitude ?? null,
      longitude: property.longitude ?? city?.longitude ?? null, price: property.price,
      propertyType: property.property_type, rooms: property.rooms, source: "agency",
      surfaceM2: property.surface_m2, title: property.title, url: `/admin/biens/${property.id}`,
    };
  }).map((candidate) => ({ ...candidate, searchArea: findCandidateSearchArea(candidate, areas) ?? undefined }));
  const interkabCandidates: InternalMatchCandidate[] = interkabGroups.flatMap((listings, index) => {
    const city = selectedCities[index];
    return listings.map((listing): InternalMatchCandidate => ({
      bathrooms: listing.bathrooms, bedrooms: listing.bedrooms, city: listing.city,
      id: listing.externalId, landAreaM2: listing.landAreaM2, latitude: city.latitude, longitude: city.longitude,
      price: listing.price, propertyType: listing.propertyType, rooms: listing.rooms, source: "interkab",
      surfaceM2: listing.surfaceM2, title: `${listing.propertyType} à ${listing.city}`, url: listing.listingUrl,
    }));
  }).map((candidate) => ({ ...candidate, searchArea: findCandidateSearchArea(candidate, areas) ?? undefined }));

  const rankedAgency = rankPropertyMatches(agencyCandidates, search);
  const rankedInterkab = rankPropertyMatches(interkabCandidates, search);
  const agencyByArea = groupMatches(rankedAgency, areas, 12);
  const interkabByArea = groupMatches(rankedInterkab, areas, 24);
  const agency = [...agencyByArea.values()].flat();
  const interkab = [...interkabByArea.values()].flat();

  return {
    agency,
    groups: areas.map((area) => ({
      agency: agencyByArea.get(String(area.id)) ?? [],
      area,
      interkab: interkabByArea.get(String(area.id)) ?? [],
    })),
    interkab,
  };
}
