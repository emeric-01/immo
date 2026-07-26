import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { hasAdminPermission } from "@/lib/admin/permissions";
import { createAdminUser, type AdminUser } from "@/lib/admin/users";

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

    return NextResponse.json({ created: true }, { status: 201 });
  } catch (error) {
    console.error("Admin user creation failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Une erreur technique a empêché la création. Le compte n’a pas été créé." },
      { status: 500 },
    );
  }
}
