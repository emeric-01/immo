import type { AdminBuyerSearchRow } from "@/lib/admin/buyer-searches";

export type InternalMatchSource = "agency" | "interkab";
export type InternalMatchTier = "strict" | "negotiation" | "expanded";

export type InternalMatchCandidate = {
  bedrooms: number | null;
  bathrooms: number | null;
  city: string;
  id: string;
  imageUrl?: string | null;
  latitude?: number | null;
  landAreaM2: number | null;
  longitude?: number | null;
  marketGapPercent?: number | null;
  marketPricePerM2?: number | null;
  price: number | null;
  pricePerM2?: number | null;
  propertyType: string;
  rooms: number | null;
  searchArea?: InternalSearchAreaMatch;
  source: InternalMatchSource;
  surfaceM2: number | null;
  title: string;
  url: string;
};

export type InternalSearchArea = {
  id: number | string;
  latitude: number | null;
  longitude: number | null;
  name: string;
  radiusKm: number;
};

export type InternalSearchAreaMatch = InternalSearchArea & {
  distanceKm: number | null;
};

export type InternalPropertyMatch = InternalMatchCandidate & {
  budgetGapPercent: number | null;
  checks: string[];
  reasons: string[];
  score: number;
  tier: InternalMatchTier;
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function toRadians(value: number) {
  return value * Math.PI / 180;
}

export function distanceInKm(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
) {
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const firstLatitude = toRadians(from.latitude);
  const secondLatitude = toRadians(to.latitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function findCandidateSearchArea(candidate: InternalMatchCandidate, areas: InternalSearchArea[]) {
  const exactAreas = areas.filter((area) => normalize(area.name) === normalize(candidate.city));
  if (exactAreas.length) return { ...exactAreas[0], distanceKm: 0 } satisfies InternalSearchAreaMatch;
  if (!Number.isFinite(candidate.latitude) || !Number.isFinite(candidate.longitude)) return null;

  const matchingAreas = areas
    .filter((area) => Number.isFinite(area.latitude) && Number.isFinite(area.longitude))
    .map((area) => ({
      ...area,
      distanceKm: distanceInKm(
        { latitude: area.latitude as number, longitude: area.longitude as number },
        { latitude: candidate.latitude as number, longitude: candidate.longitude as number },
      ),
    }))
    .filter((area) => area.distanceKm <= area.radiusKm)
    .sort((left, right) => left.distanceKm - right.distanceKm);
  return matchingAreas[0] ?? null;
}

const excludedInterkabTypes = ["terrain", "viager", "garage", "parking", "cave", "immeuble", "autre", "architecture"];

export function isExcludedInterkabPropertyType(value: string) {
  const type = normalize(value);
  return excludedInterkabTypes.some((item) => type.includes(item));
}

export function propertyCategory(value: string) {
  const type = normalize(value);
  if (isExcludedInterkabPropertyType(type)) return null;
  if (["appartement", "studio", "loft", "duplex", "triplex", "attique", "rez de jardin"].some((item) => type.includes(item))) return "apartment";
  if (["maison", "villa", "mas", "propriete", "pavillon", "bastide", "ferme", "cabanon"].some((item) => type.includes(item))) return "house";
  return null;
}

function minimumScore(value: number | null, minimum: number | null, points: number, label: string, reasons: string[], checks: string[]) {
  if (!minimum) return points;
  if (value === null) { checks.push(`${label} non renseigné`); return Math.round(points * 0.4); }
  if (value >= minimum) { reasons.push(`${label} conforme`); return points; }
  return 0;
}

export function matchPropertyToSearch(candidate: InternalMatchCandidate, search: AdminBuyerSearchRow): InternalPropertyMatch | null {
  const cities = search.city_names.map(normalize);
  const cityMatches = Boolean(candidate.searchArea) || cities.length === 0 || cities.some((city) => city === normalize(candidate.city));
  if (!cityMatches) return null;

  const category = propertyCategory(candidate.propertyType);
  if (candidate.source === "interkab" && isExcludedInterkabPropertyType(candidate.propertyType)) return null;
  if (candidate.source === "interkab" && search.property_types.length > 0 && category === null) return null;
  if (search.property_types.length > 0 && category && !search.property_types.includes(category)) return null;

  const maximumBudget = search.maximum_budget;
  const rawBudgetGapPercent = maximumBudget && candidate.price
    ? ((candidate.price - maximumBudget) / maximumBudget) * 100
    : null;
  const budgetGapPercent = rawBudgetGapPercent === null ? null : Number(rawBudgetGapPercent.toFixed(1));
  if (rawBudgetGapPercent !== null && rawBudgetGapPercent > 8) return null;

  const locationReason = candidate.searchArea
    ? candidate.searchArea.distanceKm && candidate.searchArea.distanceKm >= 0.1
      ? `${candidate.city} à ${candidate.searchArea.distanceKm.toFixed(1)} km de ${candidate.searchArea.name}`
      : `${candidate.searchArea.name} sélectionnée`
    : "ville conforme";
  const reasons: string[] = [locationReason];
  const checks: string[] = [];
  let score = 25;

  if (!search.property_types.length || category === null || search.property_types.includes(category)) {
    score += category === null && search.property_types.length ? 6 : 15;
    if (category === null && search.property_types.length) checks.push("type à vérifier");
    else reasons.push("type conforme");
  }

  if (!maximumBudget || !candidate.price) {
    score += maximumBudget ? 10 : 25;
    if (maximumBudget && !candidate.price) checks.push("prix non renseigné");
  } else if (budgetGapPercent !== null && budgetGapPercent <= 0) {
    score += 25; reasons.push("budget respecté");
  } else if (rawBudgetGapPercent !== null && rawBudgetGapPercent <= 5) {
    score += 18; reasons.push(`négociation de ${budgetGapPercent} %`);
  } else {
    score += 10; reasons.push(`effort de négociation de ${budgetGapPercent} %`);
  }

  score += minimumScore(candidate.surfaceM2, search.minimum_living_area, 10, "surface", reasons, checks);
  score += minimumScore(candidate.rooms, search.minimum_rooms, 5, "pièces", reasons, checks);
  score += minimumScore(candidate.bedrooms, search.minimum_bedrooms, 10, "chambres", reasons, checks);
  score += minimumScore(candidate.bathrooms, search.minimum_bathrooms, 5, "salles d’eau", reasons, checks);
  score += minimumScore(candidate.landAreaM2, search.minimum_land_area, 5, "terrain", reasons, checks);

  const tier: InternalMatchTier = rawBudgetGapPercent === null || rawBudgetGapPercent <= 0
    ? "strict"
    : rawBudgetGapPercent <= 5 ? "negotiation" : "expanded";
  return { ...candidate, budgetGapPercent, checks, reasons, score: Math.min(100, score), tier };
}

export function rankPropertyMatches(candidates: InternalMatchCandidate[], search: AdminBuyerSearchRow) {
  return candidates
    .map((candidate) => matchPropertyToSearch(candidate, search))
    .filter((match): match is InternalPropertyMatch => match !== null && match.score >= 60)
    .sort((left, right) => right.score - left.score || (left.price ?? Infinity) - (right.price ?? Infinity));
}
