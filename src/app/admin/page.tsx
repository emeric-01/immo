import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin/auth";
import { getAdminPermissions } from "@/lib/admin/permissions";

export default async function AdminPage() {
  const session = await requireAdminSession();
  const permissions = await getAdminPermissions(session);
  const firstPage = [
    ["properties:read", "/admin/biens"],
    ["buyer_searches:read", "/admin/recherches"],
    ["estimations:read", "/admin/estimations"],
    ["clients:read", "/admin/clients"],
    ["referrals:read", "/admin/parrainages"],
    ["contents:read", "/admin/contenus"],
  ].find(([permission]) => permissions.includes(permission as never));
  redirect(firstPage?.[1] ?? "/admin/mes-liens");
}
