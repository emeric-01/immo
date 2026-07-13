import "server-only";

import { timingSafeEqual } from "crypto";
import { hashClientAccessCode } from "@/lib/buyer-search/database";
import type { BuyerSearchFormData, PropertyType } from "@/lib/buyer-search/types";
import type { ClientSession } from "./auth";

type ClientSupabaseConfig = {
  serviceRoleKey: string;
  url: string;
};

export type ClientBuyerSearchRow = {
  city_names: string[];
  client_access_code_hash: string | null;
  client_access_enabled: boolean;
  client_last_access_at: string | null;
  client_reference: string | null;
  contact_email: string;
  contact_first_name: string;
  contact_last_name: string;
  created_at: string;
  id: string;
  location_summary: string | null;
  maximum_budget: number | null;
  minimum_bedrooms: number | null;
  minimum_living_area: number | null;
  property_types: PropertyType[];
  purchase_timeline: string | null;
  raw_payload: BuyerSearchFormData;
  status: string;
  updated_at: string;
};

export type ClientProjectResult =
  | { data: ClientBuyerSearchRow; status: "ready" }
  | { message: string; status: "missing_config" | "not_found" | "error" };

function getClientSupabaseConfig(): ClientSupabaseConfig | null {
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

export async function authenticateClientProject({
  code,
  email,
  reference,
}: {
  code: string;
  email: string;
  reference: string;
}): Promise<ClientProjectResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedReference = reference.trim().toUpperCase();

  const result = await fetchClientSearches({
    client_access_enabled: "eq.true",
    client_reference: `eq.${normalizedReference}`,
    contact_email: `eq.${normalizedEmail}`,
    limit: "1",
    select: "*",
  });

  if (result.status !== "ready") {
    return result;
  }

  const search = result.data[0];

  if (!search?.client_access_code_hash) {
    return {
      message: "Aucun projet ne correspond a ces informations.",
      status: "not_found",
    };
  }

  const expected = Buffer.from(search.client_access_code_hash);
  const received = Buffer.from(hashClientAccessCode(normalizedReference, code));

  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return {
      message: "Aucun projet ne correspond a ces informations.",
      status: "not_found",
    };
  }

  await patchClientSearch(search.id, {
    client_last_access_at: new Date().toISOString(),
  });

  return {
    data: search,
    status: "ready",
  };
}

export async function getClientBuyerSearch(session: ClientSession): Promise<ClientProjectResult> {
  const result = await fetchClientSearches({
    id: `eq.${session.id}`,
    limit: "1",
    select: "*",
  });

  if (result.status !== "ready") {
    return result;
  }

  const search = result.data[0];

  if (!search || search.client_reference !== session.reference || search.contact_email !== session.email) {
    return {
      message: "Projet introuvable ou acces expire.",
      status: "not_found",
    };
  }

  return {
    data: search,
    status: "ready",
  };
}

async function fetchClientSearches(filters: Record<string, string>) {
  const config = getClientSupabaseConfig();

  if (!config) {
    return {
      message: "Ajoutez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY pour activer l'espace client.",
      status: "missing_config" as const,
    };
  }

  const params = new URLSearchParams(filters);

  try {
    const response = await fetch(`${config.url}/rest/v1/buyer_searches?${params.toString()}`, {
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
        status: "error" as const,
      };
    }

    return {
      data: (await response.json()) as ClientBuyerSearchRow[],
      status: "ready" as const,
    };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Lecture Supabase impossible.",
      status: "error" as const,
    };
  }
}

async function patchClientSearch(id: string, payload: Record<string, unknown>) {
  const config = getClientSupabaseConfig();

  if (!config) {
    return;
  }

  await fetch(`${config.url}/rest/v1/buyer_searches?id=eq.${encodeURIComponent(id)}`, {
    body: JSON.stringify(payload),
    cache: "no-store",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    method: "PATCH",
  });
}
