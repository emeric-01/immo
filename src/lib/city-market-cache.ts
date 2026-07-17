import "server-only";

import type { City } from "./cities";
import type { CityMarketData } from "./city-market-data";

type CacheRow = {
  fetched_at: string;
  insee_code: string;
  market_data: CityMarketData;
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

function cacheLifetimeMs() {
  const days = Number(process.env.CITY_MARKET_REVALIDATE_DAYS ?? "90");
  const safeDays = Number.isFinite(days) && days > 0 ? days : 90;
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

    return response.ok;
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
