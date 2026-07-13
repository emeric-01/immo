import { NextResponse } from "next/server";
import { citySuggestions } from "@/lib/buyer-search/options";
import type { BuyerSearchCity } from "@/lib/buyer-search/types";

const GEO_API_COMMUNES_URL = "https://geo.api.gouv.fr/communes";
const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 8;
const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
};

type GeoApiCommune = {
  nom?: string;
  code?: string;
  codesPostaux?: string[];
  centre?: {
    coordinates?: [number, number];
  };
};

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: CACHE_HEADERS });
}

function normalizeQuery(query: string) {
  return query.trim().replace(/\s+/g, " ");
}

function isPostalCodeQuery(query: string) {
  return /^\d{5}$/.test(query);
}

function normalizeCommune(commune: GeoApiCommune): BuyerSearchCity | null {
  if (!commune.nom || !commune.code) {
    return null;
  }

  const [longitude, latitude] = commune.centre?.coordinates ?? [];
  const primaryPostalCode = commune.codesPostaux?.[0];

  return {
    name: commune.nom,
    postalCode: primaryPostalCode,
    postalCodes: commune.codesPostaux ?? [],
    cityCode: commune.code,
    latitude: typeof latitude === "number" ? latitude : undefined,
    longitude: typeof longitude === "number" ? longitude : undefined,
  };
}

function localFallback(query: string) {
  const normalizedQuery = query.toLowerCase();

  return citySuggestions.filter((city) => {
    const cityText = `${city.name} ${city.postalCode ?? ""}`.toLowerCase();
    return cityText.includes(normalizedQuery);
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = normalizeQuery(searchParams.get("q") ?? "");

  if (query.length < MIN_QUERY_LENGTH) {
    return json([]);
  }

  const upstreamParams = new URLSearchParams({
    fields: "nom,code,codesPostaux,centre,population",
    format: "json",
    limit: String(MAX_RESULTS),
  });

  if (isPostalCodeQuery(query)) {
    upstreamParams.set("codePostal", query);
  } else {
    upstreamParams.set("nom", query);
    upstreamParams.set("boost", "population");
  }

  try {
    const response = await fetch(`${GEO_API_COMMUNES_URL}?${upstreamParams.toString()}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      throw new Error(`geo.api.gouv.fr returned ${response.status}`);
    }

    const communes = (await response.json()) as GeoApiCommune[];
    const results = communes.map(normalizeCommune).filter((city): city is BuyerSearchCity => Boolean(city));

    return json(results.slice(0, MAX_RESULTS));
  } catch (error) {
    console.error(error);
    return json(localFallback(query), 200);
  }
}
