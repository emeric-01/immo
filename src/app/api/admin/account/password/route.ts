import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { changeAdminUserPassword } from "@/lib/admin/users";

export async function PATCH(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Votre session a expiré." }, { status: 401 });
  if (session.role === "bootstrap") return NextResponse.json({ error: "Le mot de passe bootstrap se modifie dans la configuration Vercel." }, { status: 403 });

  const input = await request.json().catch(() => null) as Partial<{
    confirmPassword: string;
    currentPassword: string;
    newPassword: string;
  }> | null;
  const currentPassword = input?.currentPassword ?? "";
  const newPassword = input?.newPassword ?? "";
  if (!currentPassword || !newPassword) return NextResponse.json({ error: "Tous les champs sont requis." }, { status: 400 });
  if (newPassword !== input?.confirmPassword) return NextResponse.json({ error: "La confirmation ne correspond pas au nouveau mot de passe." }, { status: 400 });

  const result = await changeAdminUserPassword({ currentPassword, newPassword, userId: session.id });
  if (!result.success) return NextResponse.json({ error: result.message }, { status: 400 });
  return NextResponse.json({ updated: true });
}
