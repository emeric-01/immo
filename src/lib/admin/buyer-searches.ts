import "server-only";

import { enrichMarketScoreTrends } from "@/lib/buyer-search/market-score";
import { allPreferenceOptions, preferredChannelLabels, propertyTypeLabels } from "@/lib/buyer-search/options";
import type { BuyerSearchMarketScore } from "@/lib/buyer-search/market-score-types";
import type { BuyerSearchFormData, PropertyType } from "@/lib/buyer-search/types";
import type { AdminSession } from "./auth";

type AdminSupabaseConfig = {
  serviceRoleKey: string;
  url: string;
};

export type AdminBuyerSearchRow = {
  admin_agent?: { email: string; full_name: string; id: string } | null;
  id: string;
  assigned_to: string | null;
  assigned_admin_user_id: string | null;
  attributed_admin_user_id: string | null;
  created_by_admin_user_id: string | null;
  crm_contact_id: string | null;
  attribution_snapshot: import("@/lib/attribution").AttributionSnapshot | Record<string, never>;
  archived_at: string | null;
  archived_by_admin_user_id: string | null;
  archived_from_status: BuyerSearchBusinessStatus | null;
  city_names: string[];
  client_account_id: string | null;
  consent: boolean;
  consent_at: string | null;
  contact_email: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_phone: string;
  created_at: string;
  deleted_at: string | null;
  current_situation: string | null;
  financing_status: string | null;
  ideal_budget: number | null;
  location_summary: string | null;
  maximum_budget: number | null;
  market_score: number | null;
  market_score_label: string | null;
  market_score_payload: BuyerSearchMarketScore | null;
  market_score_status: string | null;
  market_scored_at: string | null;
  metadata: Record<string, unknown>;
  minimum_bathrooms: number | null;
  minimum_bedrooms: number | null;
  minimum_land_area: number | null;
  minimum_living_area: number | null;
  minimum_rooms: number | null;
  notes: string | null;
  preferred_channel: BuyerSearchFormData["contact"]["preferredChannel"];
  preferred_channels: BuyerSearchFormData["contact"]["preferredChannels"] | null;
  preferences: BuyerSearchFormData["preferences"];
  priorities: BuyerSearchFormData["priorities"];
  property_types: PropertyType[];
  purchase_timeline: string | null;
  raw_payload: BuyerSearchFormData;
  record_origin: "admin" | "client" | "public";
  source: string;
  status: BuyerSearchStatus;
  updated_at: string;
};

export type BuyerSearchBusinessStatus = "new" | "qualified" | "contacted" | "matched" | "paused" | "closed";
export type BuyerSearchStatus = BuyerSearchBusinessStatus | "archived" | "deleted_by_client";

const buyerSearchBusinessStatuses = new Set<BuyerSearchBusinessStatus>([
  "new",
  "qualified",
  "contacted",
  "matched",
  "paused",
  "closed",
]);

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
  session?: AdminSession,
): Promise<AdminDataState<AdminBuyerSearchRow[]>> {
  const config = getAdminSupabaseConfig();

  if (!config) {
    return missingConfig();
  }

  const params = new URLSearchParams({
    limit: "200",
    order: "created_at.desc",
    select:
      "id,created_at,updated_at,deleted_at,status,archived_at,archived_by_admin_user_id,archived_from_status,source,record_origin,client_account_id,crm_contact_id,created_by_admin_user_id,contact_first_name,contact_last_name,contact_email,contact_phone,preferred_channel,preferred_channels,consent,consent_at,location_summary,city_names,property_types,ideal_budget,maximum_budget,minimum_living_area,minimum_land_area,minimum_rooms,minimum_bedrooms,minimum_bathrooms,purchase_timeline,financing_status,current_situation,preferences,priorities,raw_payload,metadata,notes,assigned_to,assigned_admin_user_id,attributed_admin_user_id,attribution_snapshot,market_score,market_score_label,market_score_payload,market_score_status,market_scored_at",
  });
  applyAgentScope(params, session);

  if (filters.status && filters.status !== "all") {
    params.set("status", `eq.${filters.status}`);
  }

  const result = await supabaseAdminFetch<AdminBuyerSearchRow[]>(config, `buyer_searches?${params.toString()}`);

  if (result.status !== "ready") {
    return result;
  }

  const usersResult = await supabaseAdminFetch<Array<{ email: string; full_name: string; id: string }>>(
    config,
    "admin_users?is_active=eq.true&select=id,email,full_name",
  );
  if (usersResult.status !== "ready") return usersResult;
  const users = new Map(usersResult.data.map((user) => [user.id, user]));
  const enriched = result.data.map((search) => ({
    ...search,
    admin_agent: users.get(search.assigned_admin_user_id || search.attributed_admin_user_id || search.created_by_admin_user_id || "") ?? null,
  }));

  const query = filters.q?.trim().toLowerCase();

  if (!query) {
    return { data: enriched, status: "ready" };
  }

  return {
    data: enriched.filter((search) =>
      [
        search.contact_first_name,
        search.contact_last_name,
        search.contact_email,
        search.contact_phone,
        search.location_summary ?? "",
        search.admin_agent?.full_name ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    ),
    status: "ready",
  };
}

export async function getAdminBuyerSearch(id: string, session?: AdminSession): Promise<AdminDataState<AdminBuyerSearchDetail | null>> {
  const config = getAdminSupabaseConfig();

  if (!config) {
    return missingConfig();
  }

  const searchParams = new URLSearchParams({
    id: `eq.${id}`,
    limit: "1",
    select: "*",
  });
  applyAgentScope(searchParams, session);

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

  const enrichedScore = search.market_score_payload
    ? await enrichMarketScoreTrends(search.market_score_payload)
    : null;

  if (enrichedScore && enrichedScore !== search.market_score_payload) {
    await patchAdminBuyerSearchScore(config, search.id, enrichedScore);
  }

  return {
    data: {
      consents: consents.data,
      locations: locations.data,
      priorities: priorities.data,
      search: {
        ...search,
        market_score_payload: enrichedScore,
      },
    },
    status: "ready",
  };
}

export async function updateAdminBuyerSearchAssignment(id: string, assignedAdminUserId: string | null, session: AdminSession) {
  if (session.role === "agent") return { message: "Un agent commercial ne peut pas réattribuer une recherche.", success: false as const };
  return patchAdminBuyerSearch(id, { assigned_admin_user_id: assignedAdminUserId }, "L’attribution n’a pas été enregistrée.");
}

export async function archiveAdminBuyerSearch(id: string, session: AdminSession) {
  if (session.role === "agent") return { message: "Un agent commercial ne peut pas archiver une recherche.", success: false as const };
  const current = await getAdminBuyerSearchMutationTarget(id, session);
  if (!current) return { message: "Recherche inaccessible.", success: false as const };
  if (current.status === "deleted_by_client") return { message: "Une recherche supprimée par le client ne peut pas être archivée.", success: false as const };
  if (current.status === "archived") return { success: true as const };
  if (!buyerSearchBusinessStatuses.has(current.status)) return { message: "Le statut actuel ne permet pas l’archivage.", success: false as const };

  return patchAdminBuyerSearch(id, {
    archived_at: new Date().toISOString(),
    archived_by_admin_user_id: session.role === "bootstrap" ? null : session.id,
    archived_from_status: current.status,
    status: "archived",
  }, "La recherche n’a pas été archivée.");
}

export async function restoreAdminBuyerSearch(id: string, session: AdminSession) {
  if (session.role === "agent") return { message: "Un agent commercial ne peut pas restaurer une recherche.", success: false as const };
  const current = await getAdminBuyerSearchMutationTarget(id, session);
  if (!current) return { message: "Recherche inaccessible.", success: false as const };
  if (current.status !== "archived") return { message: "Cette recherche n’est pas archivée.", success: false as const };
  const restoredStatus = current.archived_from_status && buyerSearchBusinessStatuses.has(current.archived_from_status)
    ? current.archived_from_status
    : "new";

  return patchAdminBuyerSearch(id, { status: restoredStatus }, "La recherche n’a pas été restaurée.");
}

export async function deleteAdminBuyerSearch(id: string, session: AdminSession) {
  const config = getAdminSupabaseConfig();
  if (!config) return { message: "Ajoutez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY pour supprimer une recherche.", success: false as const };
  if (session.role === "agent") return { message: "Un agent commercial ne peut pas supprimer une recherche.", success: false as const };
  if (!(await getAdminBuyerSearchMutationTarget(id, session))) return { message: "Recherche inaccessible.", success: false as const };

  try {
    const response = await fetch(`${config.url}/rest/v1/buyer_searches?id=eq.${encodeURIComponent(id)}&select=id`, {
      cache: "no-store",
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        Prefer: "return=representation",
      },
      method: "DELETE",
    });
    if (!response.ok) return { message: `Suppression impossible (${response.status}) : ${await response.text()}`, success: false as const };
    const rows = await response.json() as Array<{ id: string }>;
    return rows[0] ? { success: true as const } : { message: "Aucune recherche n’a été supprimée.", success: false as const };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "La suppression a échoué.", success: false as const };
  }
}

async function patchAdminBuyerSearch(
  id: string,
  payload: Record<string, unknown>,
  emptyMessage: string,
) {
  const config = getAdminSupabaseConfig();
  if (!config) return { message: "Ajoutez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY pour modifier une recherche.", success: false as const };

  try {
    const response = await fetch(`${config.url}/rest/v1/buyer_searches?id=eq.${encodeURIComponent(id)}&select=id,status`, {
      body: JSON.stringify(payload),
      cache: "no-store",
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      method: "PATCH",
    });
    if (!response.ok) return { message: `Modification impossible (${response.status}) : ${await response.text()}`, success: false as const };
    const rows = await response.json() as Array<{ id: string }>;
    return rows[0] ? { success: true as const } : { message: emptyMessage, success: false as const };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "La modification a échoué.", success: false as const };
  }
}

async function getAdminBuyerSearchMutationTarget(id: string, session: AdminSession) {
  const config = getAdminSupabaseConfig();
  if (!config) return null;
  const params = new URLSearchParams({
    id: `eq.${id}`,
    limit: "1",
    select: "id,status,archived_from_status",
  });
  applyAgentScope(params, session);
  const result = await supabaseAdminFetch<Array<Pick<AdminBuyerSearchRow, "archived_from_status" | "id" | "status">>>(
    config,
    `buyer_searches?${params}`,
  );
  return result.status === "ready" ? result.data[0] ?? null : null;
}

function applyAgentScope(params: URLSearchParams, session?: AdminSession) {
  if (session?.role === "agent") {
    params.set("or", `(assigned_admin_user_id.eq.${session.id},and(assigned_admin_user_id.is.null,attributed_admin_user_id.eq.${session.id}))`);
  }
}

async function patchAdminBuyerSearchScore(
  config: AdminSupabaseConfig,
  searchId: string,
  score: BuyerSearchMarketScore,
) {
  try {
    const response = await fetch(
      `${config.url}/rest/v1/buyer_searches?id=eq.${encodeURIComponent(searchId)}`,
      {
        body: JSON.stringify({ market_score_payload: score }),
        cache: "no-store",
        headers: {
          apikey: config.serviceRoleKey,
          Authorization: `Bearer ${config.serviceRoleKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        method: "PATCH",
      },
    );

    if (!response.ok) {
      console.error("Buyer search trend persistence failed", await response.text());
    }
  } catch (error) {
    console.error("Buyer search trend persistence failed", error);
  }
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
  const minimumLandArea = search.minimum_land_area ?? preferences.minimumLandArea ?? null;

  return [
    ...preferences.parking,
    ...preferences.outdoor,
    ...preferences.buildingComfort,
    ...preferences.additionalSpaces,
    ...preferences.houseEquipment,
    ...preferences.works,
    ...preferences.environment,
  ].map((key) => {
    if (key === "minimum_land_area" && minimumLandArea) {
      return `Surface terrain min. ${minimumLandArea} m2`;
    }

    return labels.get(key) ?? key;
  });
}

export function formatPreferredChannels(
  channels: AdminBuyerSearchRow["preferred_channels"],
  legacyChannel?: AdminBuyerSearchRow["preferred_channel"],
) {
  return preferredChannelLabels(channels?.length ? channels : legacyChannel) || "Non renseigne";
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
