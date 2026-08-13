import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { deleteCrmContact, getCrmContact } from "@/lib/admin/crm-contacts";
import { hasAdminPermission } from "@/lib/admin/permissions";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const detail = await getCrmContact(id, session);
  if (detail.status !== "ready" || !detail.data) return NextResponse.json({ error: "Fiche CRM inaccessible." }, { status: 404 });
  const canDelete = session.role !== "agent" || ((await hasAdminPermission(session, "crm_contacts:delete_own")) && detail.data.contact.created_by_admin_user_id === session.id);
  if (!canDelete) return NextResponse.json({ error: "Vous ne pouvez pas supprimer cette fiche CRM." }, { status: 403 });
  const result = await deleteCrmContact(id, session);
  return result.success ? NextResponse.json({ success: true }) : NextResponse.json({ error: result.message }, { status: 400 });
}
