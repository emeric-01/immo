import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { hasAdminPermission } from "@/lib/admin/permissions";
import { isAdminPermission } from "@/lib/admin/permission-definitions";
import { replaceAdminUserPermissions } from "@/lib/admin/users";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Votre session a expiré." }, { status: 401 });
  if (!(await hasAdminPermission(session, "users:manage"))) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const { id } = await params;
  const input = await request.json().catch(() => null) as { permissions?: unknown[] } | null;
  const permissions = Array.isArray(input?.permissions) ? input.permissions.filter(isAdminPermission) : [];
  const result = await replaceAdminUserPermissions(id, permissions);
  if (!result.success) return NextResponse.json({ error: result.message }, { status: 500 });
  return NextResponse.json({ updated: true });
}
