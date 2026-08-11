import type { AdminBuyerSearchRow } from "@/lib/admin/buyer-searches";
import type { CityMarketData } from "@/lib/city-market-data";
import type { InterkabListing } from "@/lib/interkab";

export type InterkabListingScore = {
  bestBuyerMatch: { id: string; label: string; score: number } | null;
  compatibleSearchCount: number;
  estimatedMarketValue: number | null;
  interestLabel: "À étudier" | "Intéressant" | "Prioritaire";
  interestScore: number;
  marketGapPercent: number | null;
  marketLabel: string;
  marketRangeHighValue: number | null;
  marketRangeLowValue: number | null;
  marketPricePerM2: number | null;
  marketPropertyTypeLabel: "Appartement" | "Maison" | null;
  priceGapEuro: number | null;
  pricePerM2: number | null;
  reasons: string[];
};

function propertyType(listing: InterkabListing) {
  const value = listing.propertyType.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (["appartement", "studio", "loft", "duplex"].some((type) => value.includes(type))) return "apartment";
  if (["maison", "villa", "propriete"].some((type) => value.includes(type))) return "house";
  return null;
}

function buyerMatch(listing: InterkabListing, search: AdminBuyerSearchRow) {
  let score = 0;
  const reasons: string[] = [];
  const type = propertyType(listing);
  const cities = search.city_names.map((city) => city.toLowerCase());
  if (cities.some((city) => city.includes(listing.city.toLowerCase()))) { score += 20; reasons.push("ville"); }
  if (!type || search.property_types.length === 0 || search.property_types.includes(type)) { score += 15; reasons.push("type"); }
  if (!search.maximum_budget || !listing.price || listing.price <= search.maximum_budget) { score += 25; reasons.push("budget"); }
  else if (listing.price <= search.maximum_budget * 1.05) score += 12;
  if (!search.minimum_living_area || !listing.surfaceM2 || listing.surfaceM2 >= search.minimum_living_area) { score += 15; reasons.push("surface"); }
  if (!search.minimum_rooms || !listing.rooms || listing.rooms >= search.minimum_rooms) { score += 10; reasons.push("pièces"); }
  if (!search.minimum_bedrooms || !listing.bedrooms || listing.bedrooms >= search.minimum_bedrooms) { score += 10; reasons.push("chambres"); }
  if (!search.minimum_land_area || !listing.landAreaM2 || listing.landAreaM2 >= search.minimum_land_area) { score += 5; reasons.push("terrain"); }
  return { reasons, score };
}

export function scoreInterkabListing(
  listing: InterkabListing,
  searches: AdminBuyerSearchRow[],
  market: CityMarketData | null,
): InterkabListingScore {
  const type = propertyType(listing);
  const pricePerM2 = listing.price && listing.surfaceM2 ? Math.round(listing.price / listing.surfaceM2) : null;
  const stat = type === "house" ? market?.house : type === "apartment" ? market?.apartment : null;
  const marketPricePerM2 = stat?.averagePricePerM2 ? Math.round(stat.averagePricePerM2) : null;
  const estimatedMarketValue = marketPricePerM2 && listing.surfaceM2 ? Math.round(marketPricePerM2 * listing.surfaceM2) : null;
  const marketRangeLowValue = stat?.lowPricePerM2 && listing.surfaceM2 ? Math.round(stat.lowPricePerM2 * listing.surfaceM2) : null;
  const marketRangeHighValue = stat?.highPricePerM2 && listing.surfaceM2 ? Math.round(stat.highPricePerM2 * listing.surfaceM2) : null;
  const priceGapEuro = listing.price !== null && estimatedMarketValue !== null ? listing.price - estimatedMarketValue : null;
  const marketGapPercent = pricePerM2 && marketPricePerM2
    ? Number((((pricePerM2 - marketPricePerM2) / marketPricePerM2) * 100).toFixed(1))
    : null;
  const marketScore = marketGapPercent === null ? 50 : marketGapPercent <= 0 ? 100 : Math.max(0, Math.round(100 - marketGapPercent * 3));
  const matches = searches
    .filter((search) => !["closed", "archived", "deleted_by_client"].includes(search.status))
    .map((search) => ({ search, ...buyerMatch(listing, search) }))
    .sort((left, right) => right.score - left.score);
  const compatible = matches.filter((match) => match.score >= 75);
  const best = matches[0];
  const interestScore = Math.round((best?.score ?? 50) * 0.65 + marketScore * 0.35);
  return {
    bestBuyerMatch: best ? { id: best.search.id, label: `${best.search.contact_first_name} ${best.search.contact_last_name}`.trim(), score: best.score } : null,
    compatibleSearchCount: compatible.length,
    estimatedMarketValue,
    interestLabel: interestScore >= 85 ? "Prioritaire" : interestScore >= 70 ? "Intéressant" : "À étudier",
    interestScore,
    marketGapPercent,
    marketLabel: marketGapPercent === null ? "Marché indisponible" : marketGapPercent <= -5 ? "Sous le marché" : marketGapPercent <= 8 ? "Prix cohérent" : "Au-dessus du marché",
    marketRangeHighValue,
    marketRangeLowValue,
    marketPricePerM2,
    marketPropertyTypeLabel: type === "house" ? "Maison" : type === "apartment" ? "Appartement" : null,
    priceGapEuro,
    pricePerM2,
    reasons: best?.reasons ?? [],
  };
}
