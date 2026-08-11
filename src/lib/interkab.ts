import "server-only";
import { southCities, type City } from "@/lib/cities";

export const AUBAGNE_INTERKAB_URL =
  "https://interkab.com/annonces?search%5BuniqueGeolocalite%5D%5B0%5D=4462_662&search%5BorderBy%5D=date_desc";

const FOUR_DAYS = 60 * 60 * 24 * 4;
const PILOT_DETAIL_LIMIT = 6;

export const INTERKAB_CITIES = southCities.filter((city) => ["13", "83"].includes(city.inseeCode.slice(0, 2)));
export const INTERKAB_SYNC_BATCH_SIZE = 4;

export type InterkabListing = {
  agencyName: string | null;
  agencyPhone: string | null;
  agencySiteUrl: string | null;
  agentLabel: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  city: string;
  externalId: string;
  imageUrl: string | null;
  landAreaM2: number | null;
  listingUrl: string;
  neighborhood: string | null;
  price: number | null;
  propertyType: string;
  publishedAt: string | null;
  rooms: number | null;
  surfaceM2: number | null;
  toilets: number | null;
  features: string[];
};

export type InterkabPilot = {
  fetchedAt: string;
  listings: InterkabListing[];
  pageCount: number;
  resultCount: number;
  sourceUrl: string;
};

type JsonLdNode = {
  [key: string]: unknown;
  "@type"?: string;
};

function plainText(value: string) {
  return value
    .replace(/<sup[^>]*>2<\/sup>/gi, "²")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&euro;|&#8364;/gi, "€")
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function numberFrom(value?: string) {
  if (!value) return null;
  const parsed = Number(value.replace(/[^\d.,]/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function capture(block: string, pattern: RegExp) {
  return block.match(pattern)?.[1] ?? "";
}

export function parseInterkabSearchPage(html: string): Omit<InterkabPilot, "fetchedAt" | "sourceUrl"> {
  const resultCount = numberFrom(capture(html, /<h2[^>]*class="[^"]*section__results[^"]*"[^>]*>\s*([\d\s]+)\s+annonces/i)) ?? 0;
  const pageCount = numberFrom(capture(html, /class="[^"]*load_more[^"]*"[^>]*data-max="(\d+)"/i)) ?? 1;
  const listings: InterkabListing[] = [];
  const cardPattern = /<a href="([^"]*\/annonces\/(\d+)-[^"]*)"[^>]*class="[^"]*card-property[^"]*"[^>]*>([\s\S]*?)<\/a><!-- \/\.card-property -->/gi;

  for (const match of html.matchAll(cardPattern)) {
    const [, listingUrl, externalId, card] = match;
    const facts = [...card.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((item) => plainText(item[1]));
    const rooms = numberFrom(facts.find((fact) => /pi[eè]ces?/i.test(fact)));
    const bedrooms = numberFrom(facts.find((fact) => /chambres?/i.test(fact)));
    const surfaceM2 = numberFrom(facts.find((fact) => /m[²2]/i.test(fact)));
    const city = plainText(capture(card, /card__location-content[\s\S]*?<p>([\s\S]*?)<\/p>/i));
    const agentLabel = plainText(capture(card, /card__location[\s\S]*?<span>([\s\S]*?)<\/span>/i)) || null;

    listings.push({
      agencyName: null,
      agencyPhone: null,
      agencySiteUrl: null,
      agentLabel,
      bedrooms,
      bathrooms: null,
      city,
      externalId,
      imageUrl: capture(card, /<img[^>]+src="([^"]+)"/i) || null,
      landAreaM2: null,
      listingUrl,
      neighborhood: null,
      price: numberFrom(capture(card, /card__price[\s\S]*?level-5[^>]*>([\s\S]*?)<\/div>/i)),
      propertyType: plainText(capture(card, /card__type[\s\S]*?level-6[^>]*>([\s\S]*?)<\/div>/i)),
      publishedAt: null,
      rooms,
      surfaceM2,
      toilets: null,
      features: [],
    });
  }

  return { listings, pageCount, resultCount };
}

export function parseInterkabDetailPage(html: string) {
  const scripts = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];

  for (const script of scripts) {
    try {
      const parsed = JSON.parse(script[1]) as JsonLdNode;
      const graph = Array.isArray(parsed["@graph"]) ? (parsed["@graph"] as JsonLdNode[]) : [parsed];
      const listing = graph.find((node) => {
        const type = String(node["@type"] ?? "");
        return ["Residence", "Apartment", "House", "SingleFamilyResidence"].some((value) => type.includes(value));
      });
      if (!listing) continue;
      const agency = listing.realEstateAgent as Record<string, unknown> | undefined;
      const offer = listing.offers as Record<string, unknown> | undefined;
      const characteristicStart = html.indexOf("Caractéristiques du bien");
      const characteristicEnd = characteristicStart >= 0 ? html.indexOf("Diagnostics énergétiques", characteristicStart) : -1;
      const characteristicHtml = characteristicStart >= 0
        ? html.slice(characteristicStart, characteristicEnd >= 0 ? characteristicEnd : characteristicStart + 30_000)
        : "";
      const characteristics = [...characteristicHtml.matchAll(/<li[^>]*class="[^"]*col-md-6[^"]*"[^>]*>([\s\S]*?)<\/li>/gi)]
        .map((item) => plainText(item[1]))
        .filter(Boolean);
      const featureLabels = characteristics.filter((value) =>
        !/^(surface|\d+\s*(chambre|wc|salle))/i.test(value),
      );
      const locationTitle = plainText(capture(html, /LOCALISATION DU BIEN[\s\S]*?property__subtitle[^>]*>([\s\S]*?)<\/h2>/i));
      return {
        agencyName: typeof agency?.name === "string" ? agency.name : null,
        agencyPhone: typeof agency?.telephone === "string" ? agency.telephone : null,
        agencySiteUrl: typeof agency?.url === "string" ? agency.url : null,
        bathrooms: numberFrom(characteristics.find((value) => /salle de bain|salle d'eau|salle de bain\/eau/i.test(value))),
        features: [...new Set(featureLabels)],
        landAreaM2: numberFrom(characteristics.find((value) => /jardin|terrain/i.test(value))),
        neighborhood: locationTitle.replace(/^Quartier\s+/i, "").replace(/\s+à\s+[^,]+$/i, "") || null,
        publishedAt: typeof offer?.validFrom === "string" ? offer.validFrom : null,
        toilets: numberFrom(characteristics.find((value) => /\bWC\b/i.test(value))),
      };
    } catch {
      continue;
    }
  }

  return { agencyName: null, agencyPhone: null, agencySiteUrl: null, bathrooms: null, features: [], landAreaM2: null, neighborhood: null, publishedAt: null, toilets: null };
}

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: { Accept: "text/html", "User-Agent": "JumellesImmo-Interkab-Pilot/1.0" },
    next: { revalidate: FOUR_DAYS },
  });
  if (!response.ok) throw new Error(`Interkab a répondu avec le statut ${response.status}.`);
  return response.text();
}

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return url && key ? { url: url.replace(/\/$/, ""), key } : null;
}

async function supabaseRequest(path: string, init?: RequestInit) {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Configuration Supabase absente.");
  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) throw new Error(`Supabase Interkab: ${response.status} ${await response.text()}`);
  return response;
}

export function getInterkabCitySourceUrl(city: City) {
  return `https://interkab.com/immobilier-${city.postalCode}-${city.slug}/annonces`;
}

export function parseInterkabLocationId(html: string) {
  return html.match(/id="search_uniqueGeolocalite"[\s\S]*?<option value="([^"]+)" selected="selected"/i)?.[1] ?? null;
}

export async function seedInterkabCities() {
  const rows = INTERKAB_CITIES.map((city) => ({
    insee_code: city.inseeCode,
    slug: city.slug,
    city_name: city.name,
    postal_code: city.postalCode,
    department_code: city.inseeCode.slice(0, 2),
    source_url: getInterkabCitySourceUrl(city),
    updated_at: new Date().toISOString(),
  }));
  await supabaseRequest("interkab_cities?on_conflict=insee_code", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows),
  });
}

export async function getInterkabCities() {
  const response = await supabaseRequest("interkab_cities?select=*&order=department_code.asc,city_name.asc");
  return response.json() as Promise<Array<{
    insee_code: string; slug: string; city_name: string; postal_code: string; department_code: string;
    interkab_location_id: string | null; source_url: string; status: string; last_listing_count: number;
    last_synced_at: string | null; next_sync_at: string; last_error: string | null;
  }>>;
}

export async function getStoredInterkabListings(inseeCode: string) {
  const response = await supabaseRequest(`interkab_listings?city_insee_code=eq.${encodeURIComponent(inseeCode)}&status=eq.active&select=*&order=last_seen_at.desc&limit=100`);
  const rows = await response.json() as Array<Record<string, unknown>>;
  return rows.map((row): InterkabListing => ({
    externalId: String(row.external_id), listingUrl: String(row.listing_url), imageUrl: row.image_url as string | null,
    propertyType: String(row.property_type), city: String(row.city_label), neighborhood: row.neighborhood as string | null,
    price: row.price === null ? null : Number(row.price), surfaceM2: row.surface_m2 === null ? null : Number(row.surface_m2),
    rooms: row.rooms as number | null, bedrooms: row.bedrooms as number | null, bathrooms: row.bathrooms as number | null,
    toilets: row.toilets as number | null, landAreaM2: row.land_area_m2 === null ? null : Number(row.land_area_m2),
    features: (row.features as string[]) ?? [], agencyName: row.agency_name as string | null,
    agencyPhone: row.agency_phone as string | null, agencySiteUrl: row.agency_site_url as string | null,
    agentLabel: row.agent_label as string | null, publishedAt: row.published_at as string | null,
  }));
}

async function getInterkabListingRows(inseeCode: string) {
  const rows: Array<Record<string, unknown>> = [];
  for (let start = 0; ; start += 1000) {
    const response = await supabaseRequest(`interkab_listings?city_insee_code=eq.${encodeURIComponent(inseeCode)}&select=*`, {
      headers: { Range: `${start}-${start + 999}` },
    });
    const page = await response.json() as Array<Record<string, unknown>>;
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
}

function comparableListing(row: Record<string, unknown>) {
  return JSON.stringify([
    row.listing_url ?? null, row.image_url ?? null, row.property_type ?? "", row.city_label ?? "",
    row.price === null ? null : Number(row.price), row.surface_m2 === null ? null : Number(row.surface_m2),
    row.rooms ?? null, row.bedrooms ?? null, row.agent_label ?? null,
  ]);
}

function listingRow(listing: InterkabListing, city: City, seenAt: string, existing?: Record<string, unknown>) {
  return {
    external_id: listing.externalId, city_insee_code: city.inseeCode, listing_url: listing.listingUrl,
    image_url: listing.imageUrl, property_type: listing.propertyType, city_label: listing.city,
    neighborhood: listing.neighborhood ?? existing?.neighborhood ?? null, price: listing.price,
    surface_m2: listing.surfaceM2, rooms: listing.rooms, bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms ?? existing?.bathrooms ?? null, toilets: listing.toilets ?? existing?.toilets ?? null,
    land_area_m2: listing.landAreaM2 ?? existing?.land_area_m2 ?? null,
    features: listing.features.length ? listing.features : (existing?.features ?? []),
    agency_name: listing.agencyName ?? existing?.agency_name ?? null,
    agency_phone: listing.agencyPhone ?? existing?.agency_phone ?? null,
    agency_site_url: listing.agencySiteUrl ?? existing?.agency_site_url ?? null,
    agent_label: listing.agentLabel, published_at: listing.publishedAt ?? existing?.published_at ?? null,
    last_seen_at: seenAt, status: "active", updated_at: seenAt,
  };
}

export async function syncInterkabCity(city: City, detailLimit = 3) {
  const startedAt = new Date().toISOString();
  const runResponse = await supabaseRequest("interkab_sync_runs?select=id", {
    method: "POST", headers: { Prefer: "return=representation" },
    body: JSON.stringify({ city_insee_code: city.inseeCode, started_at: startedAt }),
  });
  const [{ id: runId }] = await runResponse.json() as Array<{ id: string }>;
  try {
    const sourceUrl = getInterkabCitySourceUrl(city);
    const html = await fetchHtml(sourceUrl);
    const locationId = parseInterkabLocationId(html);
    const firstPage = parseInterkabSearchPage(html);
    const byId = new Map(firstPage.listings.map((listing) => [listing.externalId, listing]));
    for (let page = 2; page <= firstPage.pageCount; page += 1) {
      await wait(300);
      const pageHtml = await fetchHtml(`${sourceUrl}?page=${page}`);
      for (const listing of parseInterkabSearchPage(pageHtml).listings) byId.set(listing.externalId, listing);
    }
    const listings = [...byId.values()];
    const existingRows = await getInterkabListingRows(city.inseeCode);
    const scanLooksComplete = firstPage.resultCount > 0
      ? listings.length >= Math.floor(firstPage.resultCount * 0.8)
      : existingRows.length === 0 && firstPage.pageCount === 1;
    if (!scanLooksComplete) {
      throw new Error(`Collecte incomplète pour ${city.name}: ${listings.length}/${firstPage.resultCount} références. Aucun archivage appliqué.`);
    }
    const existingById = new Map(existingRows.map((row) => [String(row.external_id), row]));
    const newListings = listings.filter((listing) => !existingById.has(listing.externalId));
    const changedListings = listings.filter((listing) => {
      const existing = existingById.get(listing.externalId);
      return existing && (String(existing.status) !== "active" || comparableListing(listingRow(listing, city, "", existing)) !== comparableListing(existing));
    });
    const changedIds = new Set([...newListings, ...changedListings].map((listing) => listing.externalId));
    const listingsToWrite = listings.filter((listing) => changedIds.has(listing.externalId));
    const listingsToEnrich = listingsToWrite.slice(0, detailLimit);
    for (let index = 0; index < listingsToEnrich.length; index += 2) {
      const details = await Promise.all(listingsToEnrich.slice(index, index + 2).map(async (listing) => {
        try { return parseInterkabDetailPage(await fetchHtml(listing.listingUrl)); } catch { return null; }
      }));
      details.forEach((detail, offset) => {
        if (!detail) return;
        const externalId = listingsToEnrich[index + offset].externalId;
        const listingIndex = listings.findIndex((listing) => listing.externalId === externalId);
        listings[listingIndex] = { ...listings[listingIndex], ...detail };
      });
    }
    const seenAt = new Date().toISOString();
    const currentIds = new Set(listings.map((listing) => listing.externalId));
    const missingIds = existingRows.filter((row) => row.status === "active" && !currentIds.has(String(row.external_id))).map((row) => String(row.external_id));
    const enrichedListingsToWrite = listings.filter((listing) => changedIds.has(listing.externalId));
    if (enrichedListingsToWrite.length) await supabaseRequest("interkab_listings?on_conflict=external_id", {
      method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(enrichedListingsToWrite.map((listing) => listingRow(listing, city, seenAt, existingById.get(listing.externalId)))),
    });
    for (let index = 0; index < missingIds.length; index += 100) {
      const ids = missingIds.slice(index, index + 100).map((id) => `"${id.replaceAll('"', '')}"`).join(",");
      await supabaseRequest(`interkab_listings?city_insee_code=eq.${city.inseeCode}&external_id=in.(${encodeURIComponent(ids)})`, {
        method: "PATCH", body: JSON.stringify({ status: "missing", updated_at: seenAt }),
      });
    }
    const nextSync = new Date(Date.now() + FOUR_DAYS * 1000).toISOString();
    await Promise.all([
      supabaseRequest(`interkab_cities?insee_code=eq.${city.inseeCode}`, { method: "PATCH", body: JSON.stringify({ interkab_location_id: locationId, status: "ready", last_listing_count: firstPage.resultCount, last_synced_at: seenAt, next_sync_at: nextSync, last_error: null, updated_at: seenAt }) }),
      supabaseRequest(`interkab_sync_runs?id=eq.${runId}`, { method: "PATCH", body: JSON.stringify({ status: "success", result_count: firstPage.resultCount, listing_count: listings.length, inserted_count: newListings.length, updated_count: changedListings.length, archived_count: missingIds.length, unchanged_count: listings.length - listingsToWrite.length, completed_at: seenAt }) }),
    ]);
    return { city: city.name, resultCount: firstPage.resultCount, listingCount: listings.length, pageCount: firstPage.pageCount, inserted: newListings.length, updated: changedListings.length, archived: missingIds.length };
  } catch (cause) {
    const message = cause instanceof Error ? cause.message.slice(0, 1000) : "Erreur inconnue";
    await Promise.allSettled([
      supabaseRequest(`interkab_cities?insee_code=eq.${city.inseeCode}`, { method: "PATCH", body: JSON.stringify({ status: "error", last_error: message, next_sync_at: new Date(Date.now() + 6 * 3600_000).toISOString(), updated_at: new Date().toISOString() }) }),
      supabaseRequest(`interkab_sync_runs?id=eq.${runId}`, { method: "PATCH", body: JSON.stringify({ status: "error", error_message: message, completed_at: new Date().toISOString() }) }),
    ]);
    throw cause;
  }
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function syncDueInterkabCities(limit = INTERKAB_SYNC_BATCH_SIZE) {
  await seedInterkabCities();
  const response = await supabaseRequest(`interkab_cities?sync_enabled=is.true&next_sync_at=lte.${encodeURIComponent(new Date().toISOString())}&select=insee_code&order=next_sync_at.asc&limit=${limit}`);
  const due = await response.json() as Array<{ insee_code: string }>;
  const results = [];
  for (const row of due) {
    const city = INTERKAB_CITIES.find((candidate) => candidate.inseeCode === row.insee_code);
    if (!city) continue;
    try { results.push(await syncInterkabCity(city)); } catch (cause) { results.push({ city: city.name, error: cause instanceof Error ? cause.message : "Erreur" }); }
  }
  return results;
}

export async function getAubagneInterkabPilot(): Promise<InterkabPilot> {
  const searchHtml = await fetchHtml(AUBAGNE_INTERKAB_URL);
  const parsed = parseInterkabSearchPage(searchHtml);
  const listings = [...parsed.listings];

  for (let index = 0; index < Math.min(PILOT_DETAIL_LIMIT, listings.length); index += 2) {
    const batch = listings.slice(index, index + 2);
    const details = await Promise.all(
      batch.map(async (listing) => {
        try {
          return parseInterkabDetailPage(await fetchHtml(listing.listingUrl));
        } catch {
          return null;
        }
      }),
    );
    details.forEach((detail, offset) => {
      if (detail) listings[index + offset] = { ...listings[index + offset], ...detail };
    });
  }

  return {
    fetchedAt: new Date().toISOString(),
    listings,
    pageCount: parsed.pageCount,
    resultCount: parsed.resultCount,
    sourceUrl: AUBAGNE_INTERKAB_URL,
  };
}

export function formatFrenchPhone(value: string | null) {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits.length === 10 ? digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim() : value;
}
