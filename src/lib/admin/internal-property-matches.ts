import "server-only";

import type { AdminBuyerSearchLocation, AdminBuyerSearchRow } from "@/lib/admin/buyer-searches";
import { southCities } from "@/lib/cities";
import type { CityMarketData } from "@/lib/city-market-data";
import { readCityMarketCache } from "@/lib/city-market-cache";
import { INTERKAB_CITIES, getAllStoredInterkabListings } from "@/lib/interkab";
import { scoreInterkabListing } from "@/lib/interkab-scoring";
import { adminRest } from "@/lib/properties";
import {
  alternativeCompromiseScore,
  essentialMismatchReasons,
  findCandidateSearchArea,
  interkabAsideReason,
  isExcludedInterkabPropertyType,
  propertyCategory,
  propertyAlternativeReason,
  propertyMatchAnalysis,
  rankPropertyMatches,
  type InternalMatchCandidate,
  type InternalPropertyAside,
  type InternalPropertyMatch,
  type InternalSearchArea,
} from "./search-property-matching";

type AgencyPropertyRow = {
  bathrooms: number | null; bedrooms: number | null; city_name: string; id: string;
  land_area_m2: number | null; latitude: number | null; longitude: number | null; price: number; property_type: string; rooms: number | null;
  property_images: Array<{ is_cover: boolean; position: number; public_url: string }>;
  slug: string; surface_m2: number | null; title: string;
};

const INTERKAB_CITY_CENTER_MARGIN_KM = 1;

export type InternalPropertyMatchGroup = {
  agency: InternalPropertyMatch[];
  alternatives: InternalPropertyAside[];
  analysis: string;
  area: InternalSearchArea;
  excluded: InternalPropertyAside[];
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

function groupAside(
  candidates: InternalMatchCandidate[],
  areas: InternalSearchArea[],
  limit: number,
  search: AdminBuyerSearchRow,
  reason: (candidate: InternalMatchCandidate) => string,
) {
  return new Map(areas.map((area) => [
    String(area.id),
    candidates
      .filter((candidate) => String(candidate.searchArea?.id) === String(area.id))
      .sort((left, right) => alternativeCompromiseScore(left, search) - alternativeCompromiseScore(right, search))
      .slice(0, limit)
      .map((candidate): InternalPropertyAside => ({
        ...candidate,
        analysis: propertyMatchAnalysis(candidate, search),
        reason: reason(candidate),
      })),
  ]));
}

function matchesRequestedType(candidate: InternalMatchCandidate, search: AdminBuyerSearchRow) {
  const category = propertyCategory(candidate.propertyType);
  return category !== null && (!search.property_types.length || search.property_types.includes(category));
}

function areaAnalysis(matches: InternalPropertyMatch[], alternatives: InternalPropertyAside[]) {
  const surfaceAlternatives = alternatives.filter((candidate) => candidate.reason.toLowerCase().includes("surface"));
  const budgetAlternatives = alternatives.filter((candidate) => candidate.reason.toLowerCase().includes("budget"));
  if (matches.length && surfaceAlternatives.length) {
    return `${matches.length} bien${matches.length > 1 ? "s respectent" : " respecte"} les critères principaux. ${surfaceAlternatives.length} alternative${surfaceAlternatives.length > 1 ? "s entrent" : " entre"} dans l’enveloppe étudiée mais s’écarte d’un critère indispensable.`;
  }
  if (matches.length) return `${matches.length} bien${matches.length > 1 ? "s respectent" : " respecte"} les critères principaux de la recherche.`;
  if (surfaceAlternatives.length) {
    const budgetCopy = budgetAlternatives.length ? ` ${budgetAlternatives.length} autre${budgetAlternatives.length > 1 ? "s dépassent" : " dépasse"} le budget mais peut servir de repère.` : "";
    return `Aucun bien ne respecte actuellement tous les critères indispensables. ${surfaceAlternatives.length} alternative${surfaceAlternatives.length > 1 ? "s présentent" : " présente"} un compromis sur la surface.${budgetCopy}`;
  }
  if (budgetAlternatives.length) return `Aucun bien ne respecte le budget actuel. ${budgetAlternatives.length} alternative${budgetAlternatives.length > 1 ? "s proches sont proposées" : " proche est proposée"} pour matérialiser l’effort budgétaire nécessaire.`;
  if (alternatives.length) return `Aucun bien ne respecte tous les critères. ${alternatives.length} alternative${alternatives.length > 1 ? "s sont proposées" : " est proposée"} avec les compromis clairement indiqués.`;
  return "Aucun bien suffisamment proche des critères n’est disponible actuellement dans ce secteur.";
}

function marketMetrics(propertyType: string, price: number | null, surfaceM2: number | null, market: CityMarketData | null) {
  const category = propertyCategory(propertyType);
  const marketPricePerM2 = category === "house"
    ? market?.house.averagePricePerM2 ?? null
    : category === "apartment" ? market?.apartment.averagePricePerM2 ?? null : null;
  const pricePerM2 = price && surfaceM2 ? Math.round(price / surfaceM2) : null;
  const marketGapPercent = pricePerM2 && marketPricePerM2
    ? Number((((pricePerM2 - marketPricePerM2) / marketPricePerM2) * 100).toFixed(1))
    : null;
  return { marketGapPercent, marketPricePerM2: marketPricePerM2 ? Math.round(marketPricePerM2) : null, pricePerM2 };
}

export async function getInternalPropertyMatches(search: AdminBuyerSearchRow, locations: AdminBuyerSearchLocation[]) {
  const areas = searchAreas(search, locations);
  const selectedCities = INTERKAB_CITIES.filter((city) => {
    const candidate: InternalMatchCandidate = {
      bathrooms: null, bedrooms: null, city: city.name, id: city.inseeCode, latitude: city.latitude,
      landAreaM2: null, longitude: city.longitude, price: null, propertyType: "", rooms: null,
      source: "interkab", surfaceM2: null, title: city.name, url: "",
    };
    return Boolean(findCandidateSearchArea(candidate, areas, INTERKAB_CITY_CENTER_MARGIN_KM));
  });
  const [agencyRows, interkabGroups] = await Promise.all([
    adminRest<AgencyPropertyRow[]>("properties?status=eq.published&select=id,slug,title,city_name,property_type,price,surface_m2,rooms,bedrooms,bathrooms,land_area_m2,latitude,longitude,property_images(public_url,is_cover,position)&order=updated_at.desc"),
    Promise.all(selectedCities.map((city) => getAllStoredInterkabListings({ inseeCode: city.inseeCode }))),
  ]);
  const marketCities = Array.from(new Map([
    ...selectedCities,
    ...agencyRows.map((property) => southCities.find((city) => normalize(city.name) === normalize(property.city_name))).filter((city): city is (typeof southCities)[number] => Boolean(city)),
  ].map((city) => [city.inseeCode, city])).values());
  const marketEntries = await Promise.all(marketCities.map(async (city) => [city.inseeCode, (await readCityMarketCache(city))?.data ?? null] as const));
  const marketsByInseeCode = new Map(marketEntries);

  const agencyCandidates: InternalMatchCandidate[] = agencyRows.map((property): InternalMatchCandidate => {
    const city = southCities.find((candidate) => normalize(candidate.name) === normalize(property.city_name));
    const images = [...(property.property_images ?? [])].sort((left, right) => Number(right.is_cover) - Number(left.is_cover) || left.position - right.position);
    const metrics = marketMetrics(property.property_type, property.price, property.surface_m2, city ? marketsByInseeCode.get(city.inseeCode) ?? null : null);
    return {
      bathrooms: property.bathrooms, bedrooms: property.bedrooms, city: property.city_name,
      id: property.id, imageUrl: images[0]?.public_url ?? null, landAreaM2: property.land_area_m2, latitude: property.latitude ?? city?.latitude ?? null,
      longitude: property.longitude ?? city?.longitude ?? null, price: property.price,
      propertyType: property.property_type, rooms: property.rooms, source: "agency",
      surfaceM2: property.surface_m2, title: property.title, url: `/admin/biens/${property.id}`, ...metrics,
    };
  }).map((candidate) => ({ ...candidate, searchArea: findCandidateSearchArea(candidate, areas) ?? undefined }));
  const interkabCandidates: InternalMatchCandidate[] = interkabGroups.flatMap((listings, index) => {
    const city = selectedCities[index];
    const market = marketsByInseeCode.get(city.inseeCode) ?? null;
    return listings.map((listing): InternalMatchCandidate => {
      const score = scoreInterkabListing(listing, [], market);
      return {
        bathrooms: listing.bathrooms, bedrooms: listing.bedrooms, city: listing.city,
        id: listing.externalId, imageUrl: listing.imageUrl, landAreaM2: listing.landAreaM2, latitude: city.latitude, longitude: city.longitude,
        marketGapPercent: score.marketGapPercent, marketPricePerM2: score.marketPricePerM2,
        price: listing.price, pricePerM2: score.pricePerM2, propertyType: listing.propertyType, rooms: listing.rooms, source: "interkab",
        surfaceM2: listing.surfaceM2, title: `${listing.propertyType} à ${listing.city}`, url: listing.listingUrl,
      };
    });
  }).map((candidate) => ({
    ...candidate,
    searchArea: findCandidateSearchArea(candidate, areas, INTERKAB_CITY_CENTER_MARGIN_KM) ?? undefined,
  }));

  const rankedAgency = rankPropertyMatches(agencyCandidates, search);
  const rankedInterkab = rankPropertyMatches(interkabCandidates, search);
  const typeAsideCandidates = interkabCandidates.filter((candidate) => (
    isExcludedInterkabPropertyType(candidate.propertyType) || propertyCategory(candidate.propertyType) === null
  ));
  const alternativeCandidates = [...agencyCandidates, ...interkabCandidates].filter((candidate) => (
    matchesRequestedType(candidate, search)
    && (
      essentialMismatchReasons(candidate, search).length > 0
      || (search.maximum_budget !== null && candidate.price !== null && candidate.price > search.maximum_budget * 1.08)
    )
  ));
  const agencyByArea = groupMatches(rankedAgency, areas, 12);
  const interkabByArea = groupMatches(rankedInterkab, areas, 24);
  const alternativesByArea = groupAside(alternativeCandidates, areas, 12, search, (candidate) => propertyAlternativeReason(candidate, search));
  const excludedByArea = groupAside(typeAsideCandidates, areas, 12, search, (candidate) => interkabAsideReason(candidate.propertyType));
  const agency = [...agencyByArea.values()].flat();
  const interkab = [...interkabByArea.values()].flat();

  return {
    agency,
    groups: areas.map((area) => {
      const groupedAgency = agencyByArea.get(String(area.id)) ?? [];
      const groupedInterkab = interkabByArea.get(String(area.id)) ?? [];
      const alternatives = alternativesByArea.get(String(area.id)) ?? [];
      return {
        agency: groupedAgency,
        alternatives,
        analysis: areaAnalysis([...groupedAgency, ...groupedInterkab], alternatives),
        area,
        excluded: excludedByArea.get(String(area.id)) ?? [],
        interkab: groupedInterkab,
      };
    }),
    interkab,
  };
}
