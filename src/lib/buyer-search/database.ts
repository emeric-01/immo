import { createHmac, randomBytes } from "crypto";
import { normalizePropertyTypes } from "./options";
import type { BuyerSearchFormData } from "./types";

type BuyerSearchStorage = "database" | "local";

export type BuyerSearchSubmissionResult = {
  clientAccess?: {
    code: string;
    reference: string;
  };
  id: string;
  persisted: boolean;
  storage: BuyerSearchStorage;
  warnings?: string[];
};

export type BuyerSearchSubmissionMetadata = {
  ipAddress?: string | null;
  source?: string;
  userAgent?: string | null;
};

type SupabaseConfig = {
  apiKey: string;
  url: string;
};

type ClientAccountRow = {
  id: string;
};

function getSupabaseConfig({ requireServiceRole = false }: { requireServiceRole?: boolean } = {}): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const apiKey = requireServiceRole
    ? serviceRoleKey
    : serviceRoleKey || process.env.SUPABASE_ANON_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !apiKey) {
    return null;
  }

  return {
    apiKey,
    url: url.replace(/\/$/, ""),
  };
}

export async function createBuyerSearchRecord(
  data: BuyerSearchFormData,
  metadata: BuyerSearchSubmissionMetadata = {},
): Promise<BuyerSearchSubmissionResult> {
  const config = getSupabaseConfig({ requireServiceRole: true });

  if (!config) {
    return {
      id: `local-${Date.now()}`,
      persisted: false,
      storage: "local",
      warnings: ["Supabase service role n'est pas configure : compte client et recherche conserves localement uniquement."],
    };
  }

  const buyerSearchId = crypto.randomUUID();
  const clientAccess = buildClientAccess();
  const clientAccount = await upsertClientAccount(config, data);

  await insertSupabaseRows(
    config,
    "buyer_searches",
    buildBuyerSearchRow(buyerSearchId, data, metadata, clientAccess, clientAccount.id),
  );

  const warnings: string[] = [];

  try {
    await Promise.all([
      insertLocations(config, buyerSearchId, data),
      insertPriorities(config, buyerSearchId, data),
      insertConsent(config, buyerSearchId, data, metadata),
      updateClientAccountLastSearch(config, clientAccount.id, buyerSearchId),
    ]);
  } catch (error) {
    console.error("Buyer search secondary rows failed", error);
    warnings.push("La recherche principale est enregistree, mais certaines donnees detaillees devront etre resynchronisees.");
  }

  return {
    id: buyerSearchId,
    clientAccess: {
      code: clientAccess.code,
      reference: clientAccess.reference,
    },
    persisted: true,
    storage: "database",
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

export async function updateBuyerSearchRecord(
  buyerSearchId: string,
  data: BuyerSearchFormData,
  metadata: BuyerSearchSubmissionMetadata = {},
): Promise<BuyerSearchSubmissionResult> {
  const config = getSupabaseConfig({ requireServiceRole: true });

  if (!config) {
    return {
      id: buyerSearchId,
      persisted: false,
      storage: "local",
      warnings: ["Supabase service role n'est pas configure : la recherche n'a pas ete mise a jour en base."],
    };
  }

  const updateRow: Record<string, unknown> = { ...buildBuyerSearchRow(buyerSearchId, data, metadata) };
  delete updateRow.id;
  delete updateRow.client_access_code_hash;
  delete updateRow.client_reference;

  const clientAccount = await upsertClientAccount(config, data);
  updateRow.client_account_id = clientAccount.id;

  await updateSupabaseRows(config, "buyer_searches", `id=eq.${encodeURIComponent(buyerSearchId)}`, updateRow);

  const warnings: string[] = [];

  try {
    await Promise.all([
      deleteSupabaseRows(config, "buyer_search_locations", `buyer_search_id=eq.${encodeURIComponent(buyerSearchId)}`),
      deleteSupabaseRows(config, "buyer_search_priorities", `buyer_search_id=eq.${encodeURIComponent(buyerSearchId)}`),
      deleteSupabaseRows(config, "buyer_search_consents", `buyer_search_id=eq.${encodeURIComponent(buyerSearchId)}`),
    ]);

    await Promise.all([
      insertLocations(config, buyerSearchId, data),
      insertPriorities(config, buyerSearchId, data),
      insertConsent(config, buyerSearchId, data, metadata),
      updateClientAccountLastSearch(config, clientAccount.id, buyerSearchId),
    ]);
  } catch (error) {
    console.error("Buyer search secondary rows update failed", error);
    warnings.push("La recherche principale est mise a jour, mais certaines donnees detaillees devront etre resynchronisees.");
  }

  return {
    id: buyerSearchId,
    persisted: true,
    storage: "database",
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

async function upsertClientAccount(config: SupabaseConfig, data: BuyerSearchFormData) {
  const normalizedEmail = data.contact.email.trim().toLowerCase();
  const payload = {
    email: normalizedEmail,
    first_name: data.contact.firstName.trim(),
    last_name: data.contact.lastName.trim(),
    phone: data.contact.phone.trim(),
    preferred_channel: data.contact.preferredChannel,
  };

  const existing = await fetchSupabaseRows<ClientAccountRow[]>(
    config,
    `client_accounts?email=eq.${encodeURIComponent(normalizedEmail)}&limit=1&select=id`,
  );

  if (existing[0]) {
    await updateSupabaseRows(config, "client_accounts", `id=eq.${encodeURIComponent(existing[0].id)}`, payload);
    return existing[0];
  }

  const inserted = await insertSupabaseRows<ClientAccountRow>(config, "client_accounts", payload, true);
  const account = inserted[0];

  if (!account) {
    throw new Error("Supabase client account insert did not return a row.");
  }

  return account;
}

async function updateClientAccountLastSearch(config: SupabaseConfig, clientAccountId: string, buyerSearchId: string) {
  await updateSupabaseRows(config, "client_accounts", `id=eq.${encodeURIComponent(clientAccountId)}`, {
    last_search_id: buyerSearchId,
  });
}

async function insertLocations(config: SupabaseConfig, buyerSearchId: string, data: BuyerSearchFormData) {
  if (data.location.cities.length === 0) {
    return;
  }

  await insertSupabaseRows(
    config,
    "buyer_search_locations",
    data.location.cities.map((city, index) => ({
      buyer_search_id: buyerSearchId,
      city_code: city.cityCode ?? null,
      latitude: city.latitude ?? null,
      longitude: city.longitude ?? null,
      name: city.name,
      position: index + 1,
      postal_code: city.postalCode ?? null,
      postal_codes: city.postalCodes ?? (city.postalCode ? [city.postalCode] : []),
      radius_km: city.radiusKm ?? null,
    })),
  );
}

async function insertPriorities(config: SupabaseConfig, buyerSearchId: string, data: BuyerSearchFormData) {
  if (data.priorities.length === 0) {
    return;
  }

  await insertSupabaseRows(
    config,
    "buyer_search_priorities",
    data.priorities.map((priority, index) => ({
      buyer_search_id: buyerSearchId,
      category: priority.category,
      label: priority.label,
      level: priority.level,
      position: index + 1,
      priority_key: priority.key,
      value: priority.value,
    })),
  );
}

async function insertConsent(
  config: SupabaseConfig,
  buyerSearchId: string,
  data: BuyerSearchFormData,
  metadata: BuyerSearchSubmissionMetadata,
) {
  await insertSupabaseRows(config, "buyer_search_consents", {
    buyer_search_id: buyerSearchId,
    collected_ip: metadata.ipAddress ?? null,
    consent_given: data.contact.consent,
    consent_text:
      "J'accepte d'etre recontacte au sujet de ma recherche immobiliere et de recevoir des biens correspondant a mes criteres.",
    consent_type: "contact_and_matching",
    user_agent: metadata.userAgent ?? null,
  });
}

async function insertSupabaseRows<T>(
  config: SupabaseConfig,
  table: string,
  rows: unknown,
  returnRepresentation = false,
): Promise<T[]> {
  const response = await fetch(`${config.url}/rest/v1/${table}${returnRepresentation ? "?select=*" : ""}`, {
    body: JSON.stringify(rows),
    headers: {
      apikey: config.apiKey,
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      Prefer: returnRepresentation ? "return=representation" : "return=minimal",
    },
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase insert failed on ${table} (${response.status}): ${error}`);
  }

  if (!returnRepresentation) {
    return [];
  }

  return (await response.json()) as T[];
}

async function fetchSupabaseRows<T>(config: SupabaseConfig, path: string): Promise<T> {
  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    headers: {
      apikey: config.apiKey,
      Authorization: `Bearer ${config.apiKey}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase fetch failed (${response.status}): ${error}`);
  }

  return (await response.json()) as T;
}

async function updateSupabaseRows(config: SupabaseConfig, table: string, query: string, row: unknown) {
  const response = await fetch(`${config.url}/rest/v1/${table}?${query}`, {
    body: JSON.stringify(row),
    headers: {
      apikey: config.apiKey,
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    method: "PATCH",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase update failed on ${table} (${response.status}): ${error}`);
  }
}

async function deleteSupabaseRows(config: SupabaseConfig, table: string, query: string) {
  const response = await fetch(`${config.url}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: config.apiKey,
      Authorization: `Bearer ${config.apiKey}`,
      Prefer: "return=minimal",
    },
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase delete failed on ${table} (${response.status}): ${error}`);
  }
}

function buildBuyerSearchRow(
  id: string,
  data: BuyerSearchFormData,
  metadata: BuyerSearchSubmissionMetadata,
  clientAccess?: { code: string; codeHash: string; reference: string },
  clientAccountId?: string,
) {
  const cities = data.location.cities;
  const postalCodes = Array.from(
    new Set(cities.flatMap((city) => city.postalCodes ?? (city.postalCode ? [city.postalCode] : []))),
  );

  return {
    city_codes: cities.flatMap((city) => (city.cityCode ? [city.cityCode] : [])),
    city_names: cities.map((city) => city.name),
    ...(clientAccountId ? { client_account_id: clientAccountId } : {}),
    ...(clientAccess
      ? {
          client_access_code_hash: clientAccess.codeHash,
          client_access_enabled: true,
          client_reference: clientAccess.reference,
        }
      : {}),
    consent: data.contact.consent,
    consent_at: data.contact.consent ? new Date().toISOString() : null,
    contact_email: data.contact.email.trim().toLowerCase(),
    contact_first_name: data.contact.firstName.trim(),
    contact_last_name: data.contact.lastName.trim(),
    contact_phone: data.contact.phone.trim(),
    current_situation: data.project.currentSituation,
    financing_status: data.project.financingStatus,
    ideal_budget: data.property.idealBudget,
    id,
    location_summary: cities.map((city) => `${city.name} (${city.radiusKm ?? 2} km)`).join(", "),
    maximum_budget: data.property.maximumBudget,
    metadata: {
      ip_address: metadata.ipAddress ?? null,
      user_agent: metadata.userAgent ?? null,
    },
    minimum_bathrooms: data.characteristics.minimumBathrooms,
    minimum_bedrooms: data.characteristics.minimumBedrooms,
    minimum_living_area: data.characteristics.minimumLivingArea,
    minimum_rooms: data.characteristics.minimumRooms,
    postal_codes: postalCodes,
    preferred_channel: data.contact.preferredChannel,
    preferences: data.preferences,
    priorities: data.priorities,
    property_types: normalizePropertyTypes(data.property.types?.length ? data.property.types : data.property.type),
    purchase_timeline: data.project.purchaseTimeline,
    raw_payload: data,
    source: metadata.source ?? "website",
  };
}

function buildClientAccess() {
  const code = randomBytes(4).toString("hex").toUpperCase();
  const reference = `LJI-${randomBytes(3).toString("hex").toUpperCase()}`;

  return {
    code,
    codeHash: hashClientAccessCode(reference, code),
    reference,
  };
}

export function hashClientAccessCode(reference: string, code: string) {
  const secret =
    process.env.CLIENT_ACCESS_SECRET?.trim() ||
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim();

  if (!secret) {
    throw new Error("CLIENT_ACCESS_SECRET or Supabase key is required to hash client access codes.");
  }

  return createHmac("sha256", secret)
    .update(`${reference.trim().toUpperCase()}:${code.trim().toUpperCase()}`)
    .digest("hex");
}
