import "server-only";

import { allPreferenceOptions, optionLabel, preferredChannelOptions, propertyTypeLabels } from "@/lib/buyer-search/options";
import type { BuyerSearchFormData, PropertyType } from "@/lib/buyer-search/types";

type AdminSupabaseConfig = {
  serviceRoleKey: string;
  url: string;
};

export type AdminBuyerSearchRow = {
  id: string;
  assigned_to: string | null;
  city_names: string[];
  consent: boolean;
  consent_at: string | null;
  contact_email: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_phone: string;
  created_at: string;
  current_situation: string | null;
  financing_status: string | null;
  ideal_budget: number | null;
  location_summary: string | null;
  maximum_budget: number | null;
  metadata: Record<string, unknown>;
  minimum_bathrooms: number | null;
  minimum_bedrooms: number | null;
  minimum_living_area: number | null;
  minimum_rooms: number | null;
  notes: string | null;
  preferred_channel: BuyerSearchFormData["contact"]["preferredChannel"];
  preferences: BuyerSearchFormData["preferences"];
  priorities: BuyerSearchFormData["priorities"];
  property_types: PropertyType[];
  purchase_timeline: string | null;
  raw_payload: BuyerSearchFormData;
  source: string;
  status: "new" | "qualified" | "contacted" | "matched" | "paused" | "closed";
  updated_at: string;
};

export type AdminBuyerSearchLocation = {
  id: number;
  buyer_search_id: string;
  city_code: string | null;
  latitude: number | null;
  longitude: number | null;
  name: string;
  position: number;
  postal_code: string | null;
  postal_codes: string[];
  radius_km: number | null;
};

export type AdminBuyerSearchPriority = {
  id: number;
  buyer_search_id: string;
  category: string;
  label: string;
  level: "essential" | "desired";
  position: number;
  priority_key: string;
  value: string;
};

export type AdminBuyerSearchConsent = {
  id: string;
  buyer_search_id: string;
  collected_at: string;
  collected_ip: string | null;
  consent_given: boolean;
  consent_text: string;
  consent_type: string;
  user_agent: string | null;
};

export type AdminBuyerSearchDetail = {
  consents: AdminBuyerSearchConsent[];
  locations: AdminBuyerSearchLocation[];
  priorities: AdminBuyerSearchPriority[];
  search: AdminBuyerSearchRow;
};

export type AdminDataState<T> =
  | { data: T; status: "ready" }
  | { message: string; status: "missing_config" | "error" };

export type BuyerSearchListFilters = {
  q?: string;
  status?: string;
};

function getAdminSupabaseConfig(): AdminSupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    return null;
  }

  return {
    serviceRoleKey,
    url: url.replace(/\/$/, ""),
  };
}

export async function getAdminBuyerSearches(
  filters: BuyerSearchListFilters = {},
): Promise<AdminDataState<AdminBuyerSearchRow[]>> {
  const config = getAdminSupabaseConfig();

  if (!config) {
    return missingConfig();
  }

  const params = new URLSearchParams({
    limit: "200",
    order: "created_at.desc",
    select:
      "id,created_at,updated_at,status,source,contact_first_name,contact_last_name,contact_email,contact_phone,preferred_channel,consent,consent_at,location_summary,city_names,property_types,ideal_budget,maximum_budget,minimum_living_area,minimum_rooms,minimum_bedrooms,minimum_bathrooms,purchase_timeline,financing_status,current_situation,preferences,priorities,raw_payload,metadata,notes,assigned_to",
  });

  if (filters.status && filters.status !== "all") {
    params.set("status", `eq.${filters.status}`);
  }

  const result = await supabaseAdminFetch<AdminBuyerSearchRow[]>(config, `buyer_searches?${params.toString()}`);

  if (result.status !== "ready") {
    return result;
  }

  const query = filters.q?.trim().toLowerCase();

  if (!query) {
    return result;
  }

  return {
    data: result.data.filter((search) =>
      [
        search.contact_first_name,
        search.contact_last_name,
        search.contact_email,
        search.contact_phone,
        search.location_summary ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    ),
    status: "ready",
  };
}

export async function getAdminBuyerSearch(id: string): Promise<AdminDataState<AdminBuyerSearchDetail | null>> {
  const config = getAdminSupabaseConfig();

  if (!config) {
    return missingConfig();
  }

  const searchParams = new URLSearchParams({
    id: `eq.${id}`,
    limit: "1",
    select: "*",
  });

  const searchResult = await supabaseAdminFetch<AdminBuyerSearchRow[]>(config, `buyer_searches?${searchParams.toString()}`);

  if (searchResult.status !== "ready") {
    return searchResult;
  }

  const search = searchResult.data[0];

  if (!search) {
    return { data: null, status: "ready" };
  }

  const relationParams = (order: string) =>
    new URLSearchParams({
      buyer_search_id: `eq.${id}`,
      order,
      select: "*",
    }).toString();

  const [locations, priorities, consents] = await Promise.all([
    supabaseAdminFetch<AdminBuyerSearchLocation[]>(config, `buyer_search_locations?${relationParams("position.asc")}`),
    supabaseAdminFetch<AdminBuyerSearchPriority[]>(config, `buyer_search_priorities?${relationParams("position.asc")}`),
    supabaseAdminFetch<AdminBuyerSearchConsent[]>(config, `buyer_search_consents?${relationParams("collected_at.desc")}`),
  ]);

  if (locations.status !== "ready") {
    return locations;
  }

  if (priorities.status !== "ready") {
    return priorities;
  }

  if (consents.status !== "ready") {
    return consents;
  }

  return {
    data: {
      consents: consents.data,
      locations: locations.data,
      priorities: priorities.data,
      search,
    },
    status: "ready",
  };
}

export function getBuyerSearchAdminStats(searches: AdminBuyerSearchRow[]) {
  const newCount = searches.filter((search) => search.status === "new").length;
  const contactedCount = searches.filter((search) => search.status === "contacted").length;
  const matchedCount = searches.filter((search) => search.status === "matched").length;
  const averageBudget =
    searches.length > 0
      ? Math.round(
          searches.reduce((total, search) => total + (search.maximum_budget ?? search.ideal_budget ?? 0), 0) /
            searches.length,
        )
      : 0;

  return {
    averageBudget,
    contactedCount,
    matchedCount,
    newCount,
    total: searches.length,
  };
}

export function formatAdminPropertyTypes(types: PropertyType[] = []) {
  return types.length > 0 ? types.map((type) => propertyTypeLabels[type]).join(", ") : "Non renseigne";
}

export function formatAdminPreferences(search: AdminBuyerSearchRow) {
  const labels = new Map(allPreferenceOptions(search.property_types).map((option) => [option.key, option.label]));
  const preferences = search.preferences;

  return [
    ...preferences.parking,
    ...preferences.outdoor,
    ...preferences.buildingComfort,
    ...preferences.additionalSpaces,
    ...preferences.houseEquipment,
    ...preferences.works,
    ...preferences.environment,
  ].map((key) => labels.get(key) ?? key);
}

export function formatPreferredChannel(channel: AdminBuyerSearchRow["preferred_channel"]) {
  return optionLabel(preferredChannelOptions, channel) || "Non renseigne";
}

async function supabaseAdminFetch<T>(config: AdminSupabaseConfig, path: string): Promise<AdminDataState<T>> {
  try {
    const response = await fetch(`${config.url}/rest/v1/${path}`, {
      cache: "no-store",
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        message: `Lecture Supabase impossible (${response.status}) : ${error}`,
        status: "error",
      };
    }

    return {
      data: (await response.json()) as T,
      status: "ready",
    };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Lecture Supabase impossible.",
      status: "error",
    };
  }
}

function missingConfig(): AdminDataState<never> {
  return {
    message: "Ajoutez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY pour lire les recherches enregistrees.",
    status: "missing_config",
  };
}
