import "server-only";

export const AUBAGNE_INTERKAB_URL =
  "https://interkab.com/annonces?search%5BuniqueGeolocalite%5D%5B0%5D=4462_662&search%5BorderBy%5D=date_desc";

const FOUR_DAYS = 60 * 60 * 24 * 4;
const PILOT_DETAIL_LIMIT = 6;

export type InterkabListing = {
  agencyName: string | null;
  agencyPhone: string | null;
  agencySiteUrl: string | null;
  agentLabel: string | null;
  bedrooms: number | null;
  city: string;
  externalId: string;
  imageUrl: string | null;
  listingUrl: string;
  price: number | null;
  propertyType: string;
  publishedAt: string | null;
  rooms: number | null;
  surfaceM2: number | null;
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
      city,
      externalId,
      imageUrl: capture(card, /<img[^>]+src="([^"]+)"/i) || null,
      listingUrl,
      price: numberFrom(capture(card, /card__price[\s\S]*?level-5[^>]*>([\s\S]*?)<\/div>/i)),
      propertyType: plainText(capture(card, /card__type[\s\S]*?level-6[^>]*>([\s\S]*?)<\/div>/i)),
      publishedAt: null,
      rooms,
      surfaceM2,
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
      return {
        agencyName: typeof agency?.name === "string" ? agency.name : null,
        agencyPhone: typeof agency?.telephone === "string" ? agency.telephone : null,
        agencySiteUrl: typeof agency?.url === "string" ? agency.url : null,
        publishedAt: typeof offer?.validFrom === "string" ? offer.validFrom : null,
      };
    } catch {
      continue;
    }
  }

  return { agencyName: null, agencyPhone: null, agencySiteUrl: null, publishedAt: null };
}

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: { Accept: "text/html", "User-Agent": "JumellesImmo-Interkab-Pilot/1.0" },
    next: { revalidate: FOUR_DAYS },
  });
  if (!response.ok) throw new Error(`Interkab a répondu avec le statut ${response.status}.`);
  return response.text();
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
