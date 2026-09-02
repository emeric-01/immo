import "server-only";

import type { AdminSession } from "./auth";
import { adminPermissions, type AdminPermission } from "./permission-definitions";

export type { AdminPermission } from "./permission-definitions";

type Config = {
  key: string;
  url: string;
};

function getConfig(): Config | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  return url && key ? { key, url: url.replace(/\/$/, "") } : null;
}

export async function hasAdminPermission(session: AdminSession, permission: AdminPermission) {
  return (await getAdminPermissions(session)).includes(permission);
}

export async function getAdminPermissions(session: AdminSession): Promise<AdminPermission[]> {
  if (session.role === "bootstrap" || session.role === "admin") return [...adminPermissions];

  const config = getConfig();

  if (!config) return [];

  const userParams = new URLSearchParams({
    admin_user_id: `eq.${session.id}`,
    order: "permission.asc",
    select: "permission,is_allowed",
  });

  const roleParams = new URLSearchParams({
    role: `eq.${session.role}`,
    select: "permission",
  });

  try {
    const headers = { apikey: config.key, Authorization: `Bearer ${config.key}` };
    const userResponse = await fetch(`${config.url}/rest/v1/admin_user_permissions?${userParams}`, { cache: "no-store", headers });
    if (!userResponse.ok) return [];
    const rows = await userResponse.json() as Array<{ is_allowed: boolean; permission: AdminPermission }>;
    if (rows.length > 0) return rows.filter((row) => row.is_allowed).map((row) => row.permission);

    const roleResponse = await fetch(`${config.url}/rest/v1/admin_role_permissions?${roleParams}`, { cache: "no-store", headers });
    if (!roleResponse.ok) return [];
    const roleRows = await roleResponse.json() as Array<{ permission: AdminPermission }>;
    return roleRows.map((row) => row.permission);
  } catch {
    return [];
  }
}

export async function requireAdminPermission(session: AdminSession, permission: AdminPermission) {
  if (!(await hasAdminPermission(session, permission))) {
    throw new Error("Votre role ne permet pas cette action.");
  }
}
