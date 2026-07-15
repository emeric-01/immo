import "server-only";

import type { ClientEstimationRow } from "@/lib/client-access/estimations";
import type { AdminClientAccount, AdminDataState } from "@/lib/admin/clients";

type AdminSupabaseConfig = {
  serviceRoleKey: string;
  url: string;
};

export type AdminEstimation = ClientEstimationRow & {
  client: AdminClientAccount | null;
};

export type AdminEstimationStats = {
  activeCount: number;
  averagePrice: number;
  recentCount: number;
  total: number;
  uniqueClients: number;
};

function getConfig(): AdminSupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  return url && serviceRoleKey
    ? { serviceRoleKey, url: url.replace(/\/$/, "") }
    : null;
}

export async function getAdminEstimations(filters: { q?: string; status?: string } = {}): Promise<AdminDataState<AdminEstimation[]>> {
  const config = getConfig();
  if (!config) return missingConfig();

  const estimationParams = new URLSearchParams({
    limit: "500",
    order: "created_at.desc",
    select: "*",
  });
  if (filters.status === "active" || filters.status === "archived") {
    estimationParams.set("status", `eq.${filters.status}`);
  }

  const [estimationsResult, clientsResult] = await Promise.all([
    fetchAdmin<ClientEstimationRow[]>(config, `property_estimations?${estimationParams}`),
    fetchAdmin<AdminClientAccount[]>(config, "client_accounts?select=*&limit=500"),
  ]);
  if (estimationsResult.status !== "ready") return estimationsResult;
  if (clientsResult.status !== "ready") return clientsResult;

  const clients = new Map(clientsResult.data.map((client) => [client.id, client]));
  const rows = estimationsResult.data.map((estimation) => ({
    ...estimation,
    client: clients.get(estimation.client_account_id) ?? null,
  }));
  const query = filters.q?.trim().toLowerCase();

  return {
    data: query
      ? rows.filter((row) =>
          [row.address_label, row.city_name ?? "", row.postal_code ?? "", row.client?.first_name ?? "", row.client?.last_name ?? "", row.client?.email ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(query),
        )
      : rows,
    status: "ready",
  };
}

export async function getAdminEstimation(id: string): Promise<AdminDataState<AdminEstimation | null>> {
  const config = getConfig();
  if (!config) return missingConfig();

  const rows = await fetchAdmin<ClientEstimationRow[]>(
    config,
    `property_estimations?id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
  );
  if (rows.status !== "ready") return rows;
  const estimation = rows.data[0];
  if (!estimation) return { data: null, status: "ready" };

  const clients = await fetchAdmin<AdminClientAccount[]>(
    config,
    `client_accounts?id=eq.${encodeURIComponent(estimation.client_account_id)}&select=*&limit=1`,
  );
  if (clients.status !== "ready") return clients;

  return { data: { ...estimation, client: clients.data[0] ?? null }, status: "ready" };
}

export function getAdminEstimationStats(rows: AdminEstimation[]): AdminEstimationStats {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return {
    activeCount: rows.filter((row) => row.status === "active").length,
    averagePrice: rows.length ? Math.round(rows.reduce((sum, row) => sum + row.median_price, 0) / rows.length) : 0,
    recentCount: rows.filter((row) => new Date(row.created_at) >= sevenDaysAgo).length,
    total: rows.length,
    uniqueClients: new Set(rows.map((row) => row.client_account_id)).size,
  };
}

async function fetchAdmin<T>(config: AdminSupabaseConfig, path: string): Promise<AdminDataState<T>> {
  try {
    const response = await fetch(`${config.url}/rest/v1/${path}`, {
      cache: "no-store",
      headers: { apikey: config.serviceRoleKey, Authorization: `Bearer ${config.serviceRoleKey}` },
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
  return { message: "Ajoutez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY pour lire les estimations.", status: "missing_config" };
}
