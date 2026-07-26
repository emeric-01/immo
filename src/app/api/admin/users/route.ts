import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { hasAdminPermission } from "@/lib/admin/permissions";
import { defaultPermissionsByRole, isAdminPermission } from "@/lib/admin/permission-definitions";
import { createAdminUser, replaceAdminUserPermissions, type AdminUser } from "@/lib/admin/users";

const allowedRoles = new Set<AdminUser["role"]>(["admin", "manager", "editor", "agent"]);

export async function POST(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Votre session a expiré. Reconnectez-vous puis réessayez." }, { status: 401 });
  }

  if (!(await hasAdminPermission(session, "users:manage"))) {
    return NextResponse.json({ error: "Votre rôle ne permet pas de créer un utilisateur." }, { status: 403 });
  }

  try {
    const input = await request.json() as Partial<{
      email: string;
      fullName: string;
      password: string;
      permissions: unknown[];
      role: string;
    }>;
    const role = allowedRoles.has(input.role as AdminUser["role"])
      ? input.role as AdminUser["role"]
      : "manager";
    const result = await createAdminUser({
      email: input.email ?? "",
      fullName: input.fullName ?? "",
      password: input.password ?? "",
      role,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.message ?? "Création impossible." }, { status: 400 });
    }

    if (result.user && role !== "admin") {
      const requestedPermissions = Array.isArray(input.permissions)
        ? input.permissions.filter(isAdminPermission)
        : defaultPermissionsByRole[role];
      const permissionsResult = await replaceAdminUserPermissions(result.user.id, requestedPermissions);
      if (!permissionsResult.success) {
        return NextResponse.json({ error: `Le compte a été créé, mais ses accès n'ont pas pu être enregistrés : ${permissionsResult.message}` }, { status: 500 });
      }
    }

    return NextResponse.json({ created: true }, { status: 201 });
  } catch (error) {
    console.error("Admin user creation failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Une erreur technique a empêché la création. Le compte n’a pas été créé." },
      { status: 500 },
    );
  }
}
