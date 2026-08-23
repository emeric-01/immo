export type MarketNowcastCategory = "apartment" | "house";

export type MarketNowcastListing = {
  externalId: string;
  features?: string[];
  neighborhood?: string | null;
  price: number | null;
  propertyType: string;
  rooms?: number | null;
  surfaceM2: number | null;
};

export type MarketNowcast = {
  askingGapPercent: number;
  askingMedianPricePerM2: number;
  askingQ1PricePerM2: number;
  askingQ3PricePerM2: number;
  category: MarketNowcastCategory;
  confidencePercent: number;
  dvfMedianPricePerM2: number;
  excludedCount: number;
  listingCount: number;
  nowcastAdjustmentPercent: number;
  nowcastPricePerM2: number | null;
  sourceCount: number;
};

const EXCLUDED_LABELS = [
  "bureau",
  "commerce",
  "garage",
  "immeuble",
  "local",
  "parking",
  "programme",
  "terrain",
  "vefa",
  "viager",
];

const APARTMENT_LABELS = ["appartement", "attique", "duplex", "loft", "studio"];
const HOUSE_LABELS = ["maison", "mas", "pavillon", "propriete", "villa"];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function percentile(values: number[], ratio: number) {
  const sorted = [...values].sort((left, right) => left - right);
  const position = (sorted.length - 1) * ratio;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

function matchesCategory(label: string, category: MarketNowcastCategory) {
  const acceptedLabels = category === "apartment" ? APARTMENT_LABELS : HOUSE_LABELS;
  return acceptedLabels.some((accepted) => label.includes(accepted));
}

function isComparableListing(listing: MarketNowcastListing, category: MarketNowcastCategory) {
  const label = normalize([listing.propertyType, ...(listing.features ?? [])].join(" "));
  if (!matchesCategory(label, category)) return false;
  if (EXCLUDED_LABELS.some((excluded) => label.includes(excluded))) return false;
  if (!listing.price || !listing.surfaceM2) return false;

  const surfaceLimits = category === "apartment" ? [9, 250] : [20, 500];
  const maximumPrice = category === "apartment" ? 2_500_000 : 4_000_000;
  const pricePerM2 = listing.price / listing.surfaceM2;
  return listing.surfaceM2 >= surfaceLimits[0]
    && listing.surfaceM2 <= surfaceLimits[1]
    && listing.price >= 20_000
    && listing.price <= maximumPrice
    && pricePerM2 >= 800
    && pricePerM2 <= 12_000;
}

function listingFingerprint(listing: MarketNowcastListing, category: MarketNowcastCategory) {
  const roundedPrice = Math.round((listing.price ?? 0) / 1_000);
  const roundedSurface = Math.round(listing.surfaceM2 ?? 0);
  const neighborhood = normalize(listing.neighborhood ?? "").replace(/[^a-z0-9]/g, "");
  return [category, roundedPrice, roundedSurface, listing.rooms ?? 0, neighborhood].join(":");
}

export function buildMarketNowcast(
  listings: MarketNowcastListing[],
  category: MarketNowcastCategory,
  dvfMedianPricePerM2: number,
): MarketNowcast | null {
  const comparable = listings.filter((listing) => isComparableListing(listing, category));
  const deduplicated = new Map<string, MarketNowcastListing>();
  for (const listing of comparable) {
    const fingerprint = listingFingerprint(listing, category);
    if (!deduplicated.has(fingerprint)) deduplicated.set(fingerprint, listing);
  }

  const pricePerM2Values = [...deduplicated.values()].map((listing) => listing.price! / listing.surfaceM2!);
  if (pricePerM2Values.length === 0) return null;

  const askingMedianPricePerM2 = Math.round(percentile(pricePerM2Values, .5));
  const askingGap = askingMedianPricePerM2 / dvfMedianPricePerM2 - 1;
  const confidence = pricePerM2Values.length / (pricePerM2Values.length + 30);
  const cappedGap = Math.max(-.12, Math.min(.12, askingGap));
  const retainedGap = cappedGap * .6 * confidence;
  const canPublishNowcast = pricePerM2Values.length >= 10;

  return {
    askingGapPercent: Number((askingGap * 100).toFixed(1)),
    askingMedianPricePerM2,
    askingQ1PricePerM2: Math.round(percentile(pricePerM2Values, .25)),
    askingQ3PricePerM2: Math.round(percentile(pricePerM2Values, .75)),
    category,
    confidencePercent: Math.round(confidence * 100),
    dvfMedianPricePerM2,
    excludedCount: listings.length - pricePerM2Values.length,
    listingCount: pricePerM2Values.length,
    nowcastAdjustmentPercent: canPublishNowcast ? Number((retainedGap * 100).toFixed(1)) : 0,
    nowcastPricePerM2: canPublishNowcast ? Math.round(dvfMedianPricePerM2 * (1 + retainedGap)) : null,
    sourceCount: listings.length,
  };
}
