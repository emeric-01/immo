import "server-only";

import type { ClientEstimationRow } from "@/lib/client-access/estimations";
import type { AdminClientAccount, AdminDataState } from "@/lib/admin/clients";
import type { AdminSession } from "@/lib/admin/auth";
import type { CrmContact } from "@/lib/admin/crm-contacts";
import { createImmoDataEstimation, type PropertyEstimationInput } from "@/lib/immo-data";

type AdminSupabaseConfig = {
  serviceRoleKey: string;
  url: string;
};

export type AdminEstimation = ClientEstimationRow & {
  adminAgent: { email: string; full_name: string; id: string } | null;
  client: AdminClientAccount | null;
  crmContact: CrmContact | null;
};

export type AdminEstimationStats = {
  activeCount: number;
  averagePrice: number;
  recentCount: number;
  total: number;
  uniqueClients: number;
};

export type AdminEstimationRange = {
  highPrice: number;
  lowPrice: number;
  medianPrice: number;
};

function getConfig(): AdminSupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  return url && serviceRoleKey
    ? { serviceRoleKey, url: url.replace(/\/$/, "") }
    : null;
}

export async function getAdminEstimations(filters: { q?: string; status?: string } = {}, session?: AdminSession): Promise<AdminDataState<AdminEstimation[]>> {
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
  if (session?.role === "agent") estimationParams.set("or", `(attributed_admin_user_id.eq.${session.id},assigned_admin_user_id.eq.${session.id},created_by_admin_user_id.eq.${session.id})`);

  const [estimationsResult, clientsResult, crmContactsResult, usersResult] = await Promise.all([
    fetchAdmin<ClientEstimationRow[]>(config, `property_estimations?${estimationParams}`),
    fetchAdmin<AdminClientAccount[]>(config, "client_accounts?select=*&limit=500"),
    fetchAdmin<CrmContact[]>(config, "crm_contacts?select=*&limit=500"),
    fetchAdmin<Array<{ email: string; full_name: string; id: string }>>(config, "admin_users?is_active=eq.true&select=id,email,full_name"),
  ]);
  if (estimationsResult.status !== "ready") return estimationsResult;
  if (clientsResult.status !== "ready") return clientsResult;
  if (crmContactsResult.status !== "ready") return crmContactsResult;
  if (usersResult.status !== "ready") return usersResult;

  const clients = new Map(clientsResult.data.map((client) => [client.id, client]));
  const crmContacts = new Map(crmContactsResult.data.map((contact) => [contact.id, contact]));
  const users = new Map(usersResult.data.map((user) => [user.id, user]));
  const rows = estimationsResult.data.map((estimation) => ({
    ...estimation,
    adminAgent: users.get(estimation.assigned_admin_user_id || estimation.attributed_admin_user_id || estimation.created_by_admin_user_id || "") ?? null,
    client: estimation.client_account_id
      ? clients.get(estimation.client_account_id) ?? null
      : null,
    crmContact: estimation.crm_contact_id ? crmContacts.get(estimation.crm_contact_id) ?? null : null,
  }));
  const query = filters.q?.trim().toLowerCase();

  return {
    data: query
      ? rows.filter((row) =>
          [row.address_label, row.city_name ?? "", row.postal_code ?? "", row.client?.first_name ?? "", row.client?.last_name ?? "", row.client?.email ?? "", row.crmContact?.first_name ?? "", row.crmContact?.last_name ?? "", row.crmContact?.email ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(query),
        )
      : rows,
    status: "ready",
  };
}

export async function getAdminEstimation(id: string, session?: AdminSession): Promise<AdminDataState<AdminEstimation | null>> {
  const config = getConfig();
  if (!config) return missingConfig();

  const rows = await fetchAdmin<ClientEstimationRow[]>(
    config,
    `property_estimations?id=eq.${encodeURIComponent(id)}${session?.role === "agent" ? `&or=(attributed_admin_user_id.eq.${session.id},assigned_admin_user_id.eq.${session.id},created_by_admin_user_id.eq.${session.id})` : ""}&select=*&limit=1`,
  );
  if (rows.status !== "ready") return rows;
  const estimation = rows.data[0];
  if (!estimation) return { data: null, status: "ready" };

  const [clients, crmContacts] = await Promise.all([
    estimation.client_account_id ? fetchAdmin<AdminClientAccount[]>(config, `client_accounts?id=eq.${encodeURIComponent(estimation.client_account_id)}&select=*&limit=1`) : Promise.resolve({ data: [], status: "ready" as const }),
    estimation.crm_contact_id ? fetchAdmin<CrmContact[]>(config, `crm_contacts?id=eq.${encodeURIComponent(estimation.crm_contact_id)}&select=*&limit=1`) : Promise.resolve({ data: [], status: "ready" as const }),
  ]);
  if (clients.status !== "ready") return clients;
  if (crmContacts.status !== "ready") return crmContacts;

  return { data: { ...estimation, adminAgent: null, client: clients.data[0] ?? null, crmContact: crmContacts.data[0] ?? null }, status: "ready" };
}

export async function createStandaloneAdminEstimation(
  input: PropertyEstimationInput,
  session: AdminSession,
) {
  const config = getConfig();
  if (!config) return { message: "Ajoutez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY pour enregistrer les estimations.", success: false as const };

  try {
    const result = await createImmoDataEstimation(input);
    const persistableAdminId = session.role === "bootstrap" ? null : session.id;
    const response = await fetch(`${config.url}/rest/v1/property_estimations?select=id`, {
      body: JSON.stringify({
        address_label: result.addressLabel,
        assigned_admin_user_id: persistableAdminId,
        city_name: input.selectedAddress?.cityName ?? null,
        confidence_score: result.confidenceScore,
        created_by_admin_user_id: persistableAdminId,
        generated_high_price: result.highPrice,
        generated_low_price: result.lowPrice,
        generated_median_price: result.medianPrice,
        high_price: result.highPrice,
        input_payload: input,
        low_price: result.lowPrice,
        median_price: result.medianPrice,
        postal_code: input.selectedAddress?.postCode?.[0] ?? null,
        price_per_m2: result.pricePerM2,
        property_type: input.propertyType,
        record_origin: "admin",
        result_payload: result,
        rooms: input.rooms,
        source: result.source,
        surface_m2: input.surfaceM2,
      }),
      cache: "no-store",
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      method: "POST",
    });
    if (!response.ok) {
      return { message: `Enregistrement impossible (${response.status}) : ${await response.text()}`, success: false as const };
    }
    const rows = await response.json() as Array<{ id: string }>;
    return rows[0]
      ? { estimation: result, id: rows[0].id, success: true as const }
      : { message: "L’estimation n’a pas été enregistrée.", success: false as const };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "L’estimation a échoué.", success: false as const };
  }
}

export async function updateAdminEstimationRange(
  id: string,
  range: AdminEstimationRange,
  session: AdminSession,
) {
  const config = getConfig();
  if (!config) return { message: "Ajoutez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY pour modifier les estimations.", success: false as const };

  const current = await getAdminEstimation(id, session);
  if (current.status !== "ready" || !current.data) {
    return { message: "Estimation inaccessible.", success: false as const };
  }

  const adjustedBy = session.role === "bootstrap" ? null : session.id;
  const resultPayload = {
    ...current.data.result_payload,
    highPrice: range.highPrice,
    lowPrice: range.lowPrice,
    medianPrice: range.medianPrice,
    pricePerM2: Math.round(range.medianPrice / current.data.surface_m2),
  };
  const query = new URLSearchParams({ id: `eq.${id}` });
  if (session.role === "agent") {
    query.set("or", `(attributed_admin_user_id.eq.${session.id},assigned_admin_user_id.eq.${session.id},created_by_admin_user_id.eq.${session.id})`);
  }

  try {
    const response = await fetch(`${config.url}/rest/v1/property_estimations?${query}`, {
      body: JSON.stringify({
        high_price: range.highPrice,
        low_price: range.lowPrice,
        median_price: range.medianPrice,
        price_per_m2: resultPayload.pricePerM2,
        range_adjusted: true,
        range_adjusted_at: new Date().toISOString(),
        range_adjusted_by_admin_user_id: adjustedBy,
        result_payload: resultPayload,
      }),
      cache: "no-store",
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      method: "PATCH",
    });
    if (!response.ok) {
      return { message: `Modification impossible (${response.status}) : ${await response.text()}`, success: false as const };
    }
    const rows = await response.json() as Array<{ id: string }>;
    return rows[0]
      ? { success: true as const }
      : { message: "Aucune estimation n’a été modifiée.", success: false as const };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "Modification impossible.", success: false as const };
  }
}

export function getAdminEstimationStats(rows: AdminEstimation[]): AdminEstimationStats {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return {
    activeCount: rows.filter((row) => row.status === "active").length,
    averagePrice: rows.length ? Math.round(rows.reduce((sum, row) => sum + row.median_price, 0) / rows.length) : 0,
    recentCount: rows.filter((row) => new Date(row.created_at) >= sevenDaysAgo).length,
    total: rows.length,
    uniqueClients: new Set(rows.map((row) => row.client_account_id).filter(Boolean)).size,
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
