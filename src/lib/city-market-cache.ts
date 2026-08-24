import "server-only";

import { revalidateTag } from "next/cache";
import type { City } from "./cities";
import type { CityMarketData } from "./city-market-data";

type CacheRow = {
  fetched_at: string;
  insee_code: string;
  market_data: CityMarketData;
};

type CacheSummaryRow = {
  apartment?: CityMarketData["apartment"];
  fetched_at: string;
  house?: CityMarketData["house"];
  insee_code: string;
  market_data?: CityMarketData;
  source?: CityMarketData["source"];
  updated_at?: string;
};

type SupabaseServerConfig = {
  serviceRoleKey: string;
  url: string;
};

export type CityMarketCacheEntry = {
  data: CityMarketData;
  fetchedAt: string;
  fresh: boolean;
};

const DAY_SECONDS = 86_400;
const CITY_MARKET_CACHE_TAG = "city-market-cache";

function cacheLifetimeMs() {
  const days = Number(process.env.CITY_MARKET_REVALIDATE_DAYS ?? "30");
  const safeDays = Number.isFinite(days) && days > 0 ? days : 30;
  return safeDays * DAY_SECONDS * 1_000;
}

function getConfig(): SupabaseServerConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) return null;

  return { serviceRoleKey, url: url.replace(/\/$/, "") };
}

function headers(config: SupabaseServerConfig, prefer?: string) {
  return {
    apikey: config.serviceRoleKey,
    Authorization: `Bearer ${config.serviceRoleKey}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

export async function readCityMarketCache(city: City): Promise<CityMarketCacheEntry | null> {
  const config = getConfig();
  if (!config) return null;

  const params = new URLSearchParams({
    insee_code: `eq.${city.inseeCode}`,
    limit: "1",
    order: "fetched_at.desc",
    select: "insee_code,market_data,fetched_at",
  });

  try {
    const response = await fetch(`${config.url}/rest/v1/city_market_cache?${params}`, {
      cache: "no-store",
      headers: headers(config),
    });
    if (!response.ok) return null;

    const [row] = (await response.json()) as CacheRow[];
    if (!row?.market_data || !row.fetched_at) return null;

    return {
      data: row.market_data,
      fetchedAt: row.fetched_at,
      fresh: Date.now() - new Date(row.fetched_at).getTime() < cacheLifetimeMs(),
    };
  } catch {
    return null;
  }
}

export async function readCityMarketCaches(cities: City[]) {
  const config = getConfig();
  const entries = new Map<string, CityMarketCacheEntry>();
  if (!config || cities.length === 0) return entries;

  const codes = cities.map((city) => `"${city.inseeCode}"`).join(",");
  const params = new URLSearchParams({
    insee_code: `in.(${codes})`,
    select:
      "insee_code,fetched_at,source:market_data->>source,updated_at:market_data->>updatedAt,apartment:market_data->apartment,house:market_data->house",
  });

  try {
    const response = await fetch(`${config.url}/rest/v1/city_market_cache?${params}`, {
      cache: "no-store",
      headers: headers(config),
    });
    if (!response.ok) return entries;

    const rows = (await response.json()) as CacheSummaryRow[];
    for (const row of rows) {
      const data = row.market_data ?? (
        row.source && row.updated_at && row.apartment && row.house
          ? {
              source: row.source,
              updatedAt: row.updated_at,
              apartment: row.apartment,
              house: row.house,
              history: [],
              zones: [],
              salePoints: [],
              neighborhoods: [],
              expensiveStreets: [],
              affordableStreets: [],
            } satisfies CityMarketData
          : null
      );
      if (!row.insee_code || !data || !row.fetched_at) continue;

      entries.set(row.insee_code, {
        data,
        fetchedAt: row.fetched_at,
        fresh: Date.now() - new Date(row.fetched_at).getTime() < cacheLifetimeMs(),
      });
    }
  } catch {
    return entries;
  }

  return entries;
}

export async function writeCityMarketCache(city: City, data: CityMarketData) {
  const config = getConfig();
  if (!config) return false;

  const now = new Date().toISOString();

  try {
    const response = await fetch(`${config.url}/rest/v1/city_market_cache?on_conflict=insee_code`, {
      body: JSON.stringify({
        city_slug: city.slug,
        fetched_at: now,
        insee_code: city.inseeCode,
        market_data: data,
        updated_at: now,
      }),
      cache: "no-store",
      headers: headers(config, "resolution=merge-duplicates,return=minimal"),
      method: "POST",
    });

    if (!response.ok) return false;

    revalidateTag(CITY_MARKET_CACHE_TAG);
    return true;
  } catch {
    return false;
  }
}

export async function readCityMarketTrends(cities: City[]) {
  const config = getConfig();
  const trends = new Map<string, number>();
  if (!config || cities.length === 0) return trends;

  const codes = cities.map((city) => `"${city.inseeCode}"`).join(",");
  const params = new URLSearchParams({
    insee_code: `in.(${codes})`,
    select: "insee_code,market_data,fetched_at",
  });

  try {
    const response = await fetch(`${config.url}/rest/v1/city_market_cache?${params}`, {
      cache: "no-store",
      headers: headers(config),
    });
    if (!response.ok) return trends;

    const rows = (await response.json()) as CacheRow[];
    for (const row of rows) {
      const values = [row.market_data?.apartment?.trend1Year, row.market_data?.house?.trend1Year]
        .filter((value): value is number => typeof value === "number");
      if (values.length > 0) {
        trends.set(
          row.insee_code,
          Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1)),
        );
      }
    }
  } catch {
    return trends;
  }

  return trends;
}

export async function readCityMarketCacheDates(cities: City[]) {
  const config = getConfig();
  const dates = new Map<string, string>();
  if (!config || cities.length === 0) return dates;

  const codes = cities.map((city) => `"${city.inseeCode}"`).join(",");
  const params = new URLSearchParams({
    insee_code: `in.(${codes})`,
    select: "insee_code,fetched_at",
  });

  try {
    const response = await fetch(`${config.url}/rest/v1/city_market_cache?${params}`, {
      cache: "no-store",
      headers: headers(config),
    });
    if (!response.ok) return dates;

    const rows = (await response.json()) as Pick<CacheRow, "fetched_at" | "insee_code">[];
    for (const row of rows) {
      if (row.fetched_at) dates.set(row.insee_code, row.fetched_at);
    }
  } catch {
    return dates;
  }

  return dates;
}
