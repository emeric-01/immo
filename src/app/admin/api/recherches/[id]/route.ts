import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { deleteAdminBuyerSearch } from "@/lib/admin/buyer-searches";
import { hasAdminPermission } from "@/lib/admin/permissions";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!(await hasAdminPermission(session, "buyer_searches:read")) || session.role === "agent") {
    return NextResponse.json({ error: "Vous ne pouvez pas supprimer cette recherche." }, { status: 403 });
  }
  const { id } = await params;
  const result = await deleteAdminBuyerSearch(id, session);
  if (!result.success) return NextResponse.json({ error: result.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
