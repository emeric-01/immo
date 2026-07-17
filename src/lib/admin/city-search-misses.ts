import "server-only";

import type { AdminDataState } from "@/lib/admin/clients";
import {
  aggregateCitySearchMisses,
  type CitySearchMissEvent,
  type CitySearchMissSummary,
} from "@/lib/city-search-misses";

type AdminSupabaseConfig = {
  serviceRoleKey: string;
  url: string;
};

export type AdminCitySearchMissStats = {
  recentCount: number;
  topQuery: string;
  topQueryCount: number;
  totalEvents: number;
  uniqueQueries: number;
};

export type AdminCitySearchMisses = {
  rows: CitySearchMissSummary[];
  stats: AdminCitySearchMissStats;
};

function getConfig(): AdminSupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  return url && serviceRoleKey
    ? { serviceRoleKey, url: url.replace(/\/$/, "") }
    : null;
}

export async function getAdminCitySearchMisses(filters: { q?: string } = {}): Promise<AdminDataState<AdminCitySearchMisses>> {
  const config = getConfig();
  if (!config) return missingConfig();

  const params = new URLSearchParams({
    limit: "2000",
    order: "created_at.desc",
    select: "id,query_display,query_normalized,source,created_at",
  });
  const result = await fetchAdmin<CitySearchMissEvent[]>(config, `city_search_misses?${params.toString()}`);
  if (result.status !== "ready") return result;

  const summaries = aggregateCitySearchMisses(result.data);
  const query = filters.q?.trim().toLowerCase();
  const rows = query
    ? summaries.filter((row) => [row.displayQuery, row.normalizedQuery].join(" ").toLowerCase().includes(query))
    : summaries;

  return {
    data: {
      rows,
      stats: getStats(result.data, summaries),
    },
    status: "ready",
  };
}

function getStats(events: CitySearchMissEvent[], summaries: CitySearchMissSummary[]): AdminCitySearchMissStats {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const topQuery = summaries[0];

  return {
    recentCount: events.filter((event) => new Date(event.created_at) >= sevenDaysAgo).length,
    topQuery: topQuery?.displayQuery ?? "—",
    topQueryCount: topQuery?.searchCount ?? 0,
    totalEvents: events.length,
    uniqueQueries: summaries.length,
  };
}

async function fetchAdmin<T>(config: AdminSupabaseConfig, path: string): Promise<AdminDataState<T>> {
  try {
    const response = await fetch(`${config.url}/rest/v1/${path}`, {
      cache: "no-store",
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
      },
    });

    if (!response.ok) {
      return { message: `Lecture Supabase impossible (${response.status}) : ${await response.text()}`, status: "error" };
    }

    return { data: (await response.json()) as T, status: "ready" };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "Lecture Supabase impossible.", status: "error" };
  }
}

function missingConfig(): AdminDataState<never> {
  return { message: "Ajoutez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY pour lire les recherches de villes.", status: "missing_config" };
}
