import "server-only";

import type { AdminSession } from "./auth";

export type AdminPermission =
  | "buyer_searches:read"
  | "clients:read"
  | "contents:read"
  | "contents:write"
  | "estimations:read"
  | "properties:read"
  | "properties:write"
  | "users:manage";

type Config = {
  key: string;
  url: string;
};

const fallbackPermissions: Record<AdminSession["role"], AdminPermission[]> = {
  admin: ["buyer_searches:read", "clients:read", "contents:read", "contents:write", "estimations:read", "properties:read", "properties:write", "users:manage"],
  bootstrap: ["buyer_searches:read", "clients:read", "contents:read", "contents:write", "estimations:read", "properties:read", "properties:write", "users:manage"],
  editor: ["contents:read", "contents:write"],
  manager: ["buyer_searches:read", "clients:read", "contents:read", "contents:write", "estimations:read", "properties:read", "properties:write"],
};

function getConfig(): Config | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  return url && key ? { key, url: url.replace(/\/$/, "") } : null;
}

export async function hasAdminPermission(session: AdminSession, permission: AdminPermission) {
  if (session.role === "bootstrap" || session.role === "admin") {
    return true;
  }

  const config = getConfig();

  if (!config) {
    return fallbackPermissions[session.role].includes(permission);
  }

  const params = new URLSearchParams({
    limit: "1",
    permission: `eq.${permission}`,
    role: `eq.${session.role}`,
    select: "permission",
  });

  try {
    const response = await fetch(`${config.url}/rest/v1/admin_role_permissions?${params.toString()}`, {
      cache: "no-store",
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
      },
    });

    if (!response.ok) {
      return fallbackPermissions[session.role].includes(permission);
    }

    const rows = (await response.json()) as { permission: AdminPermission }[];

    return rows.length > 0;
  } catch {
    return fallbackPermissions[session.role].includes(permission);
  }
}

export async function requireAdminPermission(session: AdminSession, permission: AdminPermission) {
  if (!(await hasAdminPermission(session, permission))) {
    throw new Error("Votre role ne permet pas cette action.");
  }
}
