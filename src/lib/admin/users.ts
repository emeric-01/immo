import "server-only";

import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";
import { adminPermissions, type AdminPermission } from "./permission-definitions";
import { attributionCodePattern, normalizeAttributionCode, suggestAttributionCode } from "@/lib/attribution-code";

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
  referralCode?: string;
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
  const referralCode = normalizeAttributionCode(input.referralCode || suggestAttributionCode(input.fullName));

  if (!email || input.password.length < 10) {
    return {
      message: "Renseignez un email valide et un mot de passe d'au moins 10 caracteres.",
      success: false,
    };
  }

  if (!attributionCodePattern.test(referralCode)) {
    return {
      message: "Le code du lien doit contenir entre 3 et 40 caractères : lettres minuscules, chiffres ou tirets.",
      success: false,
    };
  }

  if (await getAdminAttributionLinkByCode(referralCode)) {
    return {
      message: `Le code « ${referralCode} » est déjà utilisé. Choisissez-en un autre.`,
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
  if (created) {
    const linkResult = await createDefaultAttributionLink(config, created, referralCode);
    if (!linkResult.success) {
      await fetch(`${config.url}/rest/v1/admin_users?id=eq.${encodeURIComponent(created.id)}`, {
        headers: adminHeaders(config),
        method: "DELETE",
      });
      return { message: linkResult.message, success: false };
    }
  }

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

export async function getAdminAttributionLinkByCode(code: string) {
  const config = getAdminSupabaseConfig();
  if (!config) return null;
  const query = new URLSearchParams({ code: `eq.${code}`, is_active: "eq.true", limit: "1", select: "*" });
  const result = await supabaseAdminFetch<AdminAttributionLink[]>(config, `attribution_links?${query}`);
  return result.status === "ready" ? result.data[0] ?? null : null;
}

async function createDefaultAttributionLink(config: AdminSupabaseConfig, user: SafeAdminUser, code: string) {
  const response = await fetch(`${config.url}/rest/v1/attribution_links`, {
    method: "POST", headers: adminHeaders(config, "return=minimal"),
    body: JSON.stringify({ admin_user_id: user.id, code, label: "Lien principal", landing_path: "/", utm_source: code, utm_medium: "referral", utm_campaign: "agent" }),
  });
  if (response.ok) return { success: true as const };
  const error = await response.text();
  console.error("Default attribution link creation failed", error);
  return {
    message: response.status === 409
      ? `Le code « ${code} » vient d’être attribué. Choisissez-en un autre.`
      : "Le lien d’attribution n’a pas pu être créé. Le compte n’a pas été enregistré.",
    success: false as const,
  };
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

export async function changeAdminUserPassword(input: { currentPassword: string; newPassword: string; userId: string }) {
  const config = getAdminSupabaseConfig();
  if (!config) return { message: "Configuration Supabase absente.", success: false as const };
  if (input.newPassword.length < 12) return { message: "Le nouveau mot de passe doit contenir au moins 12 caractères.", success: false as const };
  if (input.currentPassword === input.newPassword) return { message: "Choisissez un mot de passe différent de l’ancien.", success: false as const };

  const params = new URLSearchParams({
    id: `eq.${input.userId}`,
    is_active: "eq.true",
    limit: "1",
    select: "id,password_hash",
  });
  const result = await supabaseAdminFetch<Array<Pick<AdminUser, "id" | "password_hash">>>(config, `admin_users?${params}`);
  if (result.status !== "ready" || !result.data[0] || !verifyAdminPassword(input.currentPassword, result.data[0].password_hash)) {
    return { message: "Le mot de passe actuel est incorrect.", success: false as const };
  }

  const response = await fetch(`${config.url}/rest/v1/admin_users?id=eq.${encodeURIComponent(input.userId)}`, {
    body: JSON.stringify({ password_hash: hashAdminPassword(input.newPassword), updated_at: new Date().toISOString() }),
    headers: adminHeaders(config, "return=minimal"),
    method: "PATCH",
  });
  if (!response.ok) return { message: "La modification du mot de passe a échoué.", success: false as const };
  return { success: true as const };
}

export async function updateAdminUserProfile(input: { currentPassword: string; email: string; fullName: string; userId: string }) {
  const config = getAdminSupabaseConfig();
  if (!config) return { message: "Configuration Supabase absente.", success: false as const };
  const email = normalizeEmail(input.email);
  const fullName = input.fullName.trim();
  if (!/^\S+@\S+\.\S+$/.test(email) || fullName.length < 2) {
    return { message: "Renseignez un nom et une adresse e-mail valides.", success: false as const };
  }

  const params = new URLSearchParams({
    id: `eq.${input.userId}`,
    is_active: "eq.true",
    limit: "1",
    select: "id,password_hash",
  });
  const result = await supabaseAdminFetch<Array<Pick<AdminUser, "id" | "password_hash">>>(config, `admin_users?${params}`);
  if (result.status !== "ready" || !result.data[0] || !verifyAdminPassword(input.currentPassword, result.data[0].password_hash)) {
    return { message: "Le mot de passe actuel est incorrect.", success: false as const };
  }

  const response = await fetch(`${config.url}/rest/v1/admin_users?id=eq.${encodeURIComponent(input.userId)}&select=email,full_name`, {
    body: JSON.stringify({ email, full_name: fullName, updated_at: new Date().toISOString() }),
    headers: adminHeaders(config, "return=representation"),
    method: "PATCH",
  });
  if (!response.ok) {
    const error = await response.text();
    return {
      message: response.status === 409 || error.includes("duplicate")
        ? "Cette adresse e-mail est déjà utilisée par un autre compte."
        : "La modification du profil a échoué.",
      success: false as const,
    };
  }
  const [profile] = await response.json() as Array<{ email: string; full_name: string }>;
  if (!profile) return { message: "La modification du profil a échoué.", success: false as const };
  return { email: profile.email, fullName: profile.full_name, success: true as const };
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
