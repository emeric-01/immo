import "server-only";

import { propertyTypeLabels } from "@/lib/buyer-search/options";
import type { BuyerSearchFormData, PropertyType } from "@/lib/buyer-search/types";
import type { ClientEstimationRow } from "@/lib/client-access/estimations";
import type { AdminReferral } from "@/lib/admin/referrals";

type AdminSupabaseConfig = {
  serviceRoleKey: string;
  url: string;
};

export type AdminClientAccount = {
  access_enabled: boolean;
  created_at: string;
  email: string;
  first_name: string;
  id: string;
  last_login_at: string | null;
  last_name: string;
  metadata: Record<string, unknown>;
  phone: string;
  preferred_channel: BuyerSearchFormData["contact"]["preferredChannel"];
  updated_at: string;
};

export type AdminClientSearch = {
  client_account_id: string | null;
  contact_email: string;
  created_at: string;
  deleted_at: string | null;
  id: string;
  location_summary: string | null;
  maximum_budget: number | null;
  minimum_living_area: number | null;
  property_types: PropertyType[];
  status: "new" | "qualified" | "contacted" | "matched" | "paused" | "closed" | "deleted_by_client";
  updated_at: string;
};

export type AdminClientListItem = AdminClientAccount & {
  lastSearch: AdminClientSearch | null;
  searchesCount: number;
};

export type AdminClientDetail = {
  client: AdminClientAccount;
  estimations: ClientEstimationRow[];
  referrals: AdminReferral[];
  searches: AdminClientSearch[];
};

export type AdminClientListFilters = {
  q?: string;
};

export type AdminDataState<T> =
  | { data: T; status: "ready" }
  | { message: string; status: "missing_config" | "error" };

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

export async function getAdminClients(
  filters: AdminClientListFilters = {},
): Promise<AdminDataState<AdminClientListItem[]>> {
  const config = getAdminSupabaseConfig();

  if (!config) {
    return missingConfig();
  }

  const clientsParams = new URLSearchParams({
    limit: "300",
    order: "updated_at.desc",
    select: "*",
  });
  const searchesParams = new URLSearchParams({
    limit: "1000",
    order: "created_at.desc",
    select:
      "id,created_at,updated_at,deleted_at,status,contact_email,location_summary,property_types,maximum_budget,minimum_living_area,client_account_id",
  });

  const [clientsResult, searchesResult] = await Promise.all([
    supabaseAdminFetch<AdminClientAccount[]>(config, `client_accounts?${clientsParams.toString()}`),
    supabaseAdminFetch<AdminClientSearch[]>(config, `buyer_searches?${searchesParams.toString()}`),
  ]);

  if (clientsResult.status !== "ready") {
    return clientsResult;
  }

  if (searchesResult.status !== "ready") {
    return searchesResult;
  }

  const searchesByClient = new Map<string, AdminClientSearch[]>();

  searchesResult.data.forEach((search) => {
    if (!search.client_account_id) {
      return;
    }

    searchesByClient.set(search.client_account_id, [...(searchesByClient.get(search.client_account_id) ?? []), search]);
  });

  const clients = clientsResult.data.map((client) => {
    const searches = searchesByClient.get(client.id) ?? [];

    return {
      ...client,
      lastSearch: searches.find((search) => search.status !== "deleted_by_client") ?? null,
      searchesCount: searches.length,
    };
  });

  const query = filters.q?.trim().toLowerCase();

  if (!query) {
    return { data: clients, status: "ready" };
  }

  return {
    data: clients.filter((client) =>
      [client.first_name, client.last_name, client.email, client.phone, client.lastSearch?.location_summary ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query),
    ),
    status: "ready",
  };
}

export async function getAdminClient(id: string): Promise<AdminDataState<AdminClientDetail | null>> {
  const config = getAdminSupabaseConfig();

  if (!config) {
    return missingConfig();
  }

  const clientParams = new URLSearchParams({
    id: `eq.${id}`,
    limit: "1",
    select: "*",
  });
  const clientResult = await supabaseAdminFetch<AdminClientAccount[]>(config, `client_accounts?${clientParams.toString()}`);

  if (clientResult.status !== "ready") {
    return clientResult;
  }

  const client = clientResult.data[0];

  if (!client) {
    return { data: null, status: "ready" };
  }

  const searchesParams = new URLSearchParams({
    client_account_id: `eq.${id}`,
    order: "created_at.desc",
    select:
      "id,created_at,updated_at,deleted_at,status,contact_email,location_summary,property_types,maximum_budget,minimum_living_area,client_account_id",
  });
  const searchesResult = await supabaseAdminFetch<AdminClientSearch[]>(
    config,
    `buyer_searches?${searchesParams.toString()}`,
  );

  if (searchesResult.status !== "ready") {
    return searchesResult;
  }

  const estimationParams = new URLSearchParams({
    client_account_id: `eq.${id}`,
    order: "created_at.desc",
    select: "*",
  });
  const estimationsResult = await supabaseAdminFetch<ClientEstimationRow[]>(
    config,
    `property_estimations?${estimationParams.toString()}`,
  );

  if (estimationsResult.status !== "ready") {
    return estimationsResult;
  }

  const referralsParams = new URLSearchParams({
    order: "created_at.desc",
    or: `(sponsor_client_account_id.eq.${id},sponsor_email.eq.${client.email.toLowerCase()})`,
    select: "*",
  });
  const referralsResult = await supabaseAdminFetch<AdminReferral[]>(
    config,
    `referral_leads?${referralsParams.toString()}`,
  );

  if (referralsResult.status !== "ready") {
    return referralsResult;
  }

  return {
    data: {
      client,
      estimations: estimationsResult.data,
      referrals: referralsResult.data,
      searches: searchesResult.data,
    },
    status: "ready",
  };
}

export function getAdminClientStats(clients: AdminClientListItem[]) {
  const activeCount = clients.filter((client) => client.access_enabled).length;
  const withSearchCount = clients.filter((client) => client.searchesCount > 0).length;
  const returningCount = clients.filter((client) => client.searchesCount > 1).length;
  const lastSevenDays = new Date();
  lastSevenDays.setDate(lastSevenDays.getDate() - 7);
  const recentCount = clients.filter((client) => new Date(client.created_at) >= lastSevenDays).length;

  return {
    activeCount,
    recentCount,
    returningCount,
    total: clients.length,
    withSearchCount,
  };
}

export function formatAdminClientName(client: Pick<AdminClientAccount, "first_name" | "last_name">) {
  return `${client.first_name} ${client.last_name}`.trim() || "Client sans nom";
}

export function formatAdminClientPropertyTypes(types: PropertyType[] = []) {
  return types.length > 0 ? types.map((type) => propertyTypeLabels[type]).join(", ") : "Non renseigne";
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
    message: "Ajoutez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY pour lire les clients enregistres.",
    status: "missing_config",
  };
}
