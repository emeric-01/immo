import type { AdminSession } from "./auth";

/** Returns only database-backed admin IDs. The emergency bootstrap session has no admin_users UUID. */
export function getPersistableAdminUserId(session: AdminSession) {
  return session.role === "bootstrap" || session.id === "bootstrap" ? null : session.id;
}
