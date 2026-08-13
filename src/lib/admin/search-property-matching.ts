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
  isApproximate?: boolean;
};

export type InternalPropertyMatch = InternalMatchCandidate & {
  analysis: string;
  budgetGapPercent: number | null;
  checks: string[];
  reasons: string[];
  score: number;
  tier: InternalMatchTier;
};

export type InternalPropertyAside = InternalMatchCandidate & {
  analysis: string;
  reason: string;
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function formatNumber(value: number) {
  return value.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}

function formatCurrency(value: number) {
  return `${Math.round(value).toLocaleString("fr-FR")} €`;
}

function isEssential(search: AdminBuyerSearchRow, key: string) {
  const normalizedKey = normalize(key);
  return (search.priorities ?? []).some((priority) => (
    priority.level === "essential" && normalize(priority.key).includes(normalizedKey)
  ));
}

export function essentialMismatchReasons(candidate: InternalMatchCandidate, search: AdminBuyerSearchRow) {
  const reasons: string[] = [];
  const minimumSurface = search.minimum_living_area;
  if (
    minimumSurface
    && isEssential(search, "minimumLivingArea")
    && candidate.surfaceM2 !== null
    && candidate.surfaceM2 < minimumSurface * 0.95
  ) {
    const missingSurface = minimumSurface - candidate.surfaceM2;
    reasons.push(
      `La surface est de ${formatNumber(candidate.surfaceM2)} m² au lieu des ${formatNumber(minimumSurface)} m² indispensables (${formatNumber(missingSurface)} m² manquants).`,
    );
  }
  return reasons;
}

export function propertyMatchAnalysis(candidate: InternalMatchCandidate, search: AdminBuyerSearchRow) {
  const parts: string[] = [];
  if (search.maximum_budget && candidate.price) {
    const difference = search.maximum_budget - candidate.price;
    if (difference >= 0) parts.push(`Le prix entre dans le budget, avec ${formatCurrency(difference)} de marge`);
    else parts.push(`Le prix dépasse le budget de ${formatCurrency(Math.abs(difference))}`);
  } else if (search.maximum_budget) {
    parts.push("Le respect du budget reste à vérifier");
  }

  if (search.minimum_living_area && candidate.surfaceM2 !== null) {
    const difference = candidate.surfaceM2 - search.minimum_living_area;
    if (difference >= 0) parts.push(`la surface respecte le minimum de ${formatNumber(search.minimum_living_area)} m²`);
    else parts.push(`la surface est inférieure de ${formatNumber(Math.abs(difference))} m² au minimum demandé`);
  } else if (search.minimum_living_area) {
    parts.push("la surface reste à vérifier");
  }

  if (!parts.length) return "Les principaux critères connus sont compatibles avec la recherche.";
  return `${parts.join(", mais ")}.`;
}

export function propertyAlternativeReason(candidate: InternalMatchCandidate, search: AdminBuyerSearchRow) {
  const essentialReasons = essentialMismatchReasons(candidate, search);
  if (essentialReasons.length) return essentialReasons[0];
  if (search.maximum_budget && candidate.price && candidate.price > search.maximum_budget) {
    const difference = candidate.price - search.maximum_budget;
    const percent = (difference / search.maximum_budget) * 100;
    return `Budget dépassé de ${formatCurrency(difference)} (+${formatNumber(percent)} %).`;
  }
  if (search.minimum_living_area && candidate.surfaceM2 !== null && candidate.surfaceM2 < search.minimum_living_area) {
    return `Surface inférieure de ${formatNumber(search.minimum_living_area - candidate.surfaceM2)} m² au minimum demandé.`;
  }
  return "Alternative proche avec plusieurs critères à vérifier.";
}

export function alternativeCompromiseScore(candidate: InternalMatchCandidate, search: AdminBuyerSearchRow) {
  const budgetPenalty = search.maximum_budget
    ? candidate.price === null
      ? 0.35
      : Math.max(0, candidate.price - search.maximum_budget) / search.maximum_budget
    : 0;
  const surfacePenalty = search.minimum_living_area
    ? candidate.surfaceM2 === null
      ? 0.35
      : Math.max(0, search.minimum_living_area - candidate.surfaceM2) / search.minimum_living_area
    : 0;
  return budgetPenalty + surfacePenalty;
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

export function findCandidateSearchArea(
  candidate: InternalMatchCandidate,
  areas: InternalSearchArea[],
  approximationMarginKm = 0,
) {
  const exactAreas = areas.filter((area) => normalize(area.name) === normalize(candidate.city));
  if (exactAreas.length) return { ...exactAreas[0], distanceKm: 0, isApproximate: false } satisfies InternalSearchAreaMatch;
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
    .filter((area) => area.distanceKm <= area.radiusKm + approximationMarginKm)
    .sort((left, right) => left.distanceKm - right.distanceKm);
  const match = matchingAreas[0];
  return match ? { ...match, isApproximate: match.distanceKm > match.radiusKm } : null;
}

const excludedInterkabTypes = ["terrain", "viager", "garage", "parking", "cave", "immeuble", "autre", "architecture"];

export function isExcludedInterkabPropertyType(value: string) {
  const type = normalize(value);
  return excludedInterkabTypes.some((item) => type.includes(item));
}

export function interkabAsideReason(value: string) {
  const type = normalize(value);
  if (type.includes("terrain")) return "Terrain non demandé pour cette recherche";
  if (type.includes("viager")) return "Vente en viager non demandée";
  if (["garage", "parking", "cave"].some((item) => type.includes(item))) return "Annexe vendue seule, hors critères";
  if (type.includes("immeuble")) return "Immeuble entier hors critères";
  if (["autre", "architecture"].some((item) => type.includes(item))) return "Catégorie atypique hors critères";
  return "Type de bien non compatible avec cette recherche";
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
  if (candidate.source === "interkab" && category === null) return null;
  if (search.property_types.length > 0 && category && !search.property_types.includes(category)) return null;
  if (essentialMismatchReasons(candidate, search).length) return null;

  const maximumBudget = search.maximum_budget;
  const rawBudgetGapPercent = maximumBudget && candidate.price
    ? ((candidate.price - maximumBudget) / maximumBudget) * 100
    : null;
  const budgetGapPercent = rawBudgetGapPercent === null ? null : Number(rawBudgetGapPercent.toFixed(1));
  if (rawBudgetGapPercent !== null && rawBudgetGapPercent > 8) return null;

  const locationReason = candidate.searchArea
    ? candidate.searchArea.isApproximate
      ? `${candidate.city}, commune limitrophe à ${candidate.searchArea.distanceKm?.toFixed(1)} km de ${candidate.searchArea.name}`
      : candidate.searchArea.distanceKm && candidate.searchArea.distanceKm >= 0.1
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
  return { ...candidate, analysis: propertyMatchAnalysis(candidate, search), budgetGapPercent, checks, reasons, score: Math.min(100, score), tier };
}

export function rankPropertyMatches(candidates: InternalMatchCandidate[], search: AdminBuyerSearchRow) {
  return candidates
    .map((candidate) => matchPropertyToSearch(candidate, search))
    .filter((match): match is InternalPropertyMatch => match !== null && match.score >= 60)
    .sort((left, right) => right.score - left.score || (left.price ?? Infinity) - (right.price ?? Infinity));
}
