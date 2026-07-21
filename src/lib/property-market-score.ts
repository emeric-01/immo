import "server-only";

import { getCityByMarketIdentifier } from "@/lib/cities";
import { readCityMarketCache } from "@/lib/city-market-cache";
import type { CityMarketData, CitySalePoint, PropertyMarketStat } from "@/lib/city-market-data";
import type { Property } from "@/lib/properties";

export type PropertyMarketScore = {
  score: number;
  listingPricePerM2: number;
  referencePricePerM2: number;
  rangeLowPerM2: number;
  rangeHighPerM2: number;
  gapPercent: number;
  qualityAdjustmentPercent: number;
  qualityFactors: string[];
  marketPosition: "below" | "within" | "above";
  propertyTypeLabel: "Appartement" | "Maison";
  comparableCount: number;
  source: "DVF + marché ville" | "Marché ville";
  updatedAt: string;
  status: "coherent" | "watch" | "high-gap";
  label: string;
};

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function normalize(value: string | null | undefined) {
  return (value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function comparablePrices(property: Property, sales: CitySalePoint[]) {
  const expectedType = property.property_type === "house" ? "Maison" : "Appartement";
  return sales
    .filter((sale) => sale.propertyType === expectedType && typeof sale.pricePerM2 === "number" && sale.pricePerM2 > 0)
    .filter((sale) => !property.surface_m2 || !sale.surfaceM2 || (sale.surfaceM2 >= property.surface_m2 * 0.7 && sale.surfaceM2 <= property.surface_m2 * 1.35))
    .filter((sale) => !property.rooms || !sale.rooms || Math.abs(sale.rooms - property.rooms) <= 1)
    .map((sale) => sale.pricePerM2 as number);
}

function qualityAdjustment(property: Property) {
  let percent = 0;
  const factors: string[] = [];
  const add = (value: number, label: string) => { percent += value; factors.push(`${label} ${value > 0 ? "+" : ""}${value}%`); };
  const condition = normalize(property.property_condition);

  if (condition === "neuf") add(8, "Neuf");
  else if (condition.includes("excellent")) add(6, "Excellent état");
  else if (condition.includes("bon etat")) add(2, "Bon état");
  else if (condition.includes("rafraichir")) add(-5, "À rafraîchir");
  else if (condition.includes("renover")) add(-12, "À rénover");

  const amenities = new Set((property.amenities ?? []).map(normalize));
  const feature = (name: string, value: number, label = name) => { if (amenities.has(normalize(name))) add(value, label); };
  feature("Terrasse", property.property_type === "apartment" ? 4 : 3);
  feature("Balcon", 2);
  feature("Parking", 3);
  feature("Garage", 4);
  if (property.property_type === "apartment") feature("Ascenseur", 2);
  feature("Cave", 1);
  if (property.property_type === "house") {
    feature("Jardin", 5);
    feature("Piscine", 7);
    feature("Cheminée", 2);
  }
  feature("Vue mer", 8);
  feature("Climatisation", 2);
  feature("Accès PMR", 1);

  if ((property.parking_spaces ?? 0) > 0 && !amenities.has("parking") && !amenities.has("garage")) add(2, "Stationnement");
  const exposure = normalize(property.exposure);
  if (exposure.includes("sud") || exposure.includes("ouest")) add(2, "Bonne exposition");
  if (property.energy_rating === "A") add(3, "DPE A");
  else if (property.energy_rating === "B") add(2, "DPE B");
  else if (property.energy_rating === "F") add(-3, "DPE F");
  else if (property.energy_rating === "G") add(-6, "DPE G");

  if (property.property_type === "house" && property.land_area_m2 && property.surface_m2) {
    const ratio = property.land_area_m2 / property.surface_m2;
    if (ratio >= 8) add(6, "Grande parcelle");
    else if (ratio >= 4) add(4, "Parcelle généreuse");
    else if (ratio >= 2) add(2, "Terrain");
  }

  return { percent: Math.max(-18, Math.min(25, percent)), factors };
}

function adjustedRange(reference: number, stat: PropertyMarketStat, comparableCount: number) {
  const spread = comparableCount >= 4 ? 0.09 : comparableCount >= 2 ? 0.11 : 0.14;
  const low = Math.max(stat.lowPricePerM2 || 0, reference * (1 - spread));
  const highMarket = stat.highPricePerM2 > 0 ? stat.highPricePerM2 : Number.POSITIVE_INFINITY;
  const high = Math.min(highMarket, reference * (1 + spread));
  return {
    low: Math.round(Math.min(low, reference * 0.98)),
    high: Math.round(Math.max(high, reference * 1.02)),
  };
}

export function calculatePropertyMarketScore(property: Property, market: CityMarketData): PropertyMarketScore | null {
  if (!property.surface_m2 || property.surface_m2 <= 0 || property.price <= 0 || !["apartment", "house"].includes(property.property_type)) return null;
  const propertyTypeLabel = property.property_type === "house" ? "Maison" : "Appartement";
  const stat = property.property_type === "house" ? market.house : market.apartment;
  if (!stat.averagePricePerM2 || stat.averagePricePerM2 <= 0) return null;

  const listingPricePerM2 = property.price / property.surface_m2;
  const comparables = comparablePrices(property, market.salePoints);
  const baseReference = comparables.length >= 2 ? median(comparables) * 0.7 + stat.averagePricePerM2 * 0.3 : stat.averagePricePerM2;
  const quality = qualityAdjustment(property);
  const referencePricePerM2 = baseReference * (1 + quality.percent / 100);
  const range = adjustedRange(referencePricePerM2, stat, comparables.length);
  const gapPercent = ((listingPricePerM2 - referencePricePerM2) / referencePricePerM2) * 100;
  const marketPosition = listingPricePerM2 < range.low ? "below" : listingPricePerM2 > range.high ? "above" : "within";
  const distanceFromRange = marketPosition === "below"
    ? ((range.low - listingPricePerM2) / range.low) * 100
    : marketPosition === "above"
      ? ((listingPricePerM2 - range.high) / range.high) * 100
      : 0;
  const score = Math.max(0, Math.min(100, Math.round(100 - distanceFromRange * 3)));
  const status = marketPosition === "within" ? "coherent" : distanceFromRange <= 10 ? "watch" : "high-gap";
  const label = marketPosition === "within" ? "Dans la fourchette" : marketPosition === "below" ? "Sous la fourchette" : "Au-dessus de la fourchette";

  return {
    score,
    listingPricePerM2: Math.round(listingPricePerM2),
    referencePricePerM2: Math.round(referencePricePerM2),
    rangeLowPerM2: range.low,
    rangeHighPerM2: range.high,
    gapPercent: Number(gapPercent.toFixed(1)),
    qualityAdjustmentPercent: quality.percent,
    qualityFactors: quality.factors,
    marketPosition,
    propertyTypeLabel,
    comparableCount: comparables.length,
    source: comparables.length >= 2 ? "DVF + marché ville" : "Marché ville",
    updatedAt: market.updatedAt,
    status,
    label,
  };
}

export async function getPropertyMarketScores(properties: Property[]) {
  const markets = new Map<string, CityMarketData>();
  const uniqueCities = [...new Set(properties.map((property) => property.city_name))];
  await Promise.all(uniqueCities.map(async (cityName) => {
    const city = getCityByMarketIdentifier({ name: cityName });
    if (!city) return;
    const cached = await readCityMarketCache(city);
    if (cached?.data) markets.set(cityName, cached.data);
  }));
  return new Map(properties.map((property) => [property.id, markets.has(property.city_name) ? calculatePropertyMarketScore(property, markets.get(property.city_name) as CityMarketData) : null]));
}
