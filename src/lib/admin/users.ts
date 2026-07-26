import "server-only";

import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";
import { adminPermissions, type AdminPermission } from "./permission-definitions";

type AdminSupabaseConfig = {
  serviceRoleKey: string;
  url: string;
};

export type AdminUser = {
  created_at: string;
  email: string;
  full_name: string;
  id: string;
  is_active: boolean;
  last_login_at: string | null;
  password_hash: string;
  role: "admin" | "manager" | "editor" | "agent";
  updated_at: string;
};

export type SafeAdminUser = Omit<AdminUser, "password_hash">;

export type AdminUsersState =
  | { data: SafeAdminUser[]; status: "ready" }
  | { message: string; status: "missing_config" | "error" };

const passwordHashAlgorithm = "pbkdf2_sha256";
const passwordIterations = 310000;
const passwordKeyLength = 32;

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

export function isAdminUsersDatabaseConfigured() {
  return Boolean(getAdminSupabaseConfig());
}

export async function listAdminUsers(): Promise<AdminUsersState> {
  const config = getAdminSupabaseConfig();

  if (!config) {
    return missingConfig();
  }

  const params = new URLSearchParams({
    order: "created_at.desc",
    select: "id,email,full_name,role,is_active,created_at,updated_at,last_login_at",
  });
  const result = await supabaseAdminFetch<SafeAdminUser[]>(config, `admin_users?${params.toString()}`);

  return result;
}

export async function createAdminUser(input: {
  email: string;
  fullName: string;
  password: string;
  role: AdminUser["role"];
}) {
  const config = getAdminSupabaseConfig();

  if (!config) {
    return {
      message: "Ajoutez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY pour gerer les utilisateurs admin.",
      success: false,
    };
  }

  const email = normalizeEmail(input.email);

  if (!email || input.password.length < 10) {
    return {
      message: "Renseignez un email valide et un mot de passe d'au moins 10 caracteres.",
      success: false,
    };
  }

  const response = await fetch(`${config.url}/rest/v1/admin_users?select=id,email,full_name,role,is_active,created_at,updated_at,last_login_at`, {
    body: JSON.stringify({
      email,
      full_name: input.fullName.trim() || email,
      password_hash: hashAdminPassword(input.password),
      role: input.role,
    }),
    headers: adminHeaders(config, "return=representation"),
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.text();
    return {
      message: `Creation impossible : ${error}`,
      success: false,
    };
  }

  const [created] = await response.json() as SafeAdminUser[];
  if (created) await ensureDefaultAttributionLink(config, created);

  return { success: true, user: created };
}

export type AdminUserPermissionRow = {
  admin_user_id: string;
  is_allowed: boolean;
  permission: AdminPermission;
};

export async function listAdminUserPermissions() {
  const config = getAdminSupabaseConfig();
  if (!config) return { data: [] as AdminUserPermissionRow[], status: "missing_config" as const, message: "Configuration Supabase absente." };
  return supabaseAdminFetch<AdminUserPermissionRow[]>(config, "admin_user_permissions?select=admin_user_id,permission,is_allowed&order=permission.asc");
}

export async function replaceAdminUserPermissions(adminUserId: string, allowedPermissions: AdminPermission[]) {
  const config = getAdminSupabaseConfig();
  if (!config) return { message: "Configuration Supabase absente.", success: false as const };

  const response = await fetch(`${config.url}/rest/v1/admin_user_permissions?on_conflict=admin_user_id,permission`, {
    body: JSON.stringify(adminPermissions.map((permission) => ({
      admin_user_id: adminUserId,
      is_allowed: allowedPermissions.includes(permission),
      permission,
    }))),
    headers: adminHeaders(config, "resolution=merge-duplicates,return=minimal"),
    method: "POST",
  });

  if (!response.ok) return { message: await response.text(), success: false as const };
  return { success: true as const };
}

export type AdminAttributionLink = { id: string; admin_user_id: string; code: string; label: string; landing_path: string; utm_source: string; utm_medium: string; utm_campaign: string; is_active: boolean };

export async function listAdminAttributionLinks(adminUserId?: string) {
  const config = getAdminSupabaseConfig();
  if (!config) return { data: [] as AdminAttributionLink[], status: "missing_config" as const, message: "Configuration Supabase absente." };
  const query = new URLSearchParams({ select: "*", order: "created_at.desc" });
  if (adminUserId) query.set("admin_user_id", `eq.${adminUserId}`);
  return supabaseAdminFetch<AdminAttributionLink[]>(config, `attribution_links?${query}`);
}

async function ensureDefaultAttributionLink(config: AdminSupabaseConfig, user: SafeAdminUser) {
  const base = user.full_name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30) || user.id.slice(0, 8);
  const code = `${base}-${user.id.slice(0, 5)}`;
  const response = await fetch(`${config.url}/rest/v1/attribution_links`, {
    method: "POST", headers: adminHeaders(config, "return=minimal"),
    body: JSON.stringify({ admin_user_id: user.id, code, label: "Lien principal", landing_path: "/", utm_source: code, utm_medium: "referral", utm_campaign: "agent" }),
  });
  if (!response.ok) console.error("Default attribution link creation failed", await response.text());
}

export async function authenticateAdminUser(email: string, password: string) {
  const config = getAdminSupabaseConfig();

  if (!config) {
    return null;
  }

  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    return null;
  }

  const params = new URLSearchParams({
    email: `eq.${normalizedEmail}`,
    is_active: "eq.true",
    limit: "1",
    select: "id,email,full_name,role,is_active,password_hash,created_at,updated_at,last_login_at",
  });
  const result = await supabaseAdminFetch<AdminUser[]>(config, `admin_users?${params.toString()}`);

  if (result.status !== "ready") {
    return null;
  }

  const user = result.data[0];

  if (!user || !verifyAdminPassword(password, user.password_hash)) {
    return null;
  }

  await fetch(`${config.url}/rest/v1/admin_users?id=eq.${user.id}`, {
    body: JSON.stringify({ last_login_at: new Date().toISOString() }),
    headers: adminHeaders(config, "return=minimal"),
    method: "PATCH",
  });

  return {
    created_at: user.created_at,
    email: user.email,
    full_name: user.full_name,
    id: user.id,
    is_active: user.is_active,
    last_login_at: user.last_login_at,
    role: user.role,
    updated_at: user.updated_at,
  };
}

function hashAdminPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, passwordIterations, passwordKeyLength, "sha256").toString("hex");

  return [passwordHashAlgorithm, passwordIterations, salt, hash].join("$");
}

function verifyAdminPassword(password: string, storedHash: string) {
  const [algorithm, iterations, salt, hash] = storedHash.split("$");

  if (algorithm !== passwordHashAlgorithm || !iterations || !salt || !hash) {
    return false;
  }

  const candidate = pbkdf2Sync(password, salt, Number(iterations), passwordKeyLength, "sha256");
  const expected = Buffer.from(hash, "hex");

  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}

async function supabaseAdminFetch<T>(config: AdminSupabaseConfig, path: string) {
  try {
    const response = await fetch(`${config.url}/rest/v1/${path}`, {
      cache: "no-store",
      headers: adminHeaders(config),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        message: `Lecture Supabase impossible (${response.status}) : ${error}`,
        status: "error" as const,
      };
    }

    return {
      data: (await response.json()) as T,
      status: "ready" as const,
    };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Lecture Supabase impossible.",
      status: "error" as const,
    };
  }
}

function adminHeaders(config: AdminSupabaseConfig, prefer?: string) {
  return {
    apikey: config.serviceRoleKey,
    Authorization: `Bearer ${config.serviceRoleKey}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function missingConfig(): AdminUsersState {
  return {
    message: "Ajoutez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY pour gerer les utilisateurs admin.",
    status: "missing_config",
  };
}
