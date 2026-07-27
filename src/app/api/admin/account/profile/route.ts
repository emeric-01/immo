import { NextResponse } from "next/server";
import { getAdminSession, refreshAdminSessionProfile } from "@/lib/admin/auth";
import { updateAdminUserProfile } from "@/lib/admin/users";

export async function PATCH(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Votre session a expiré." }, { status: 401 });
  if (session.role === "bootstrap") return NextResponse.json({ error: "Le profil bootstrap se modifie dans la configuration Vercel." }, { status: 403 });

  const input = await request.json().catch(() => null) as Partial<{
    currentPassword: string;
    email: string;
    fullName: string;
  }> | null;
  if (!input?.currentPassword || !input.email || !input.fullName) {
    return NextResponse.json({ error: "Tous les champs sont requis." }, { status: 400 });
  }

  const result = await updateAdminUserProfile({
    currentPassword: input.currentPassword,
    email: input.email,
    fullName: input.fullName,
    userId: session.id,
  });
  if (!result.success) return NextResponse.json({ error: result.message }, { status: 400 });
  await refreshAdminSessionProfile(session, { email: result.email, fullName: result.fullName });
  return NextResponse.json({ email: result.email, fullName: result.fullName, updated: true });
}
