import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { deleteAdminBuyerSearch } from "@/lib/admin/buyer-searches";
import { hasAdminPermission } from "@/lib/admin/permissions";
import { buyerSearchSchema } from "@/lib/buyer-search/schema";
import { updateBuyerSearchRecord } from "@/lib/buyer-search/database";
import { getAdminBuyerSearch } from "@/lib/admin/buyer-searches";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!(await hasAdminPermission(session, "buyer_searches:read")) || (session.role === "agent" && !(await hasAdminPermission(session, "buyer_searches:delete_own")))) {
    return NextResponse.json({ error: "Vous ne pouvez pas supprimer cette recherche." }, { status: 403 });
  }
  const { id } = await params;
  const result = await deleteAdminBuyerSearch(id, session);
  if (!result.success) return NextResponse.json({ error: result.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession(); if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!(await hasAdminPermission(session, "buyer_searches:read")) || (session.role === "agent" && !(await hasAdminPermission(session, "buyer_searches:update_own")))) return NextResponse.json({ error: "Modification refusée." }, { status: 403 });
  const { id } = await params; const current = await getAdminBuyerSearch(id, session);
  if (current.status !== "ready" || !current.data) return NextResponse.json({ error: "Recherche inaccessible." }, { status: 404 });
  const search = current.data.search;
  const owns = search.created_by_admin_user_id === session.id || search.assigned_admin_user_id === session.id || search.attributed_admin_user_id === session.id;
  if (session.role === "agent" && !owns) return NextResponse.json({ error: "Modification refusée." }, { status: 403 });
  const parsed = buyerSearchSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  await updateBuyerSearchRecord(id, parsed.data, { source: search.source });
  return NextResponse.json({ success: true });
}
