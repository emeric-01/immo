import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { hasAdminPermission } from "@/lib/admin/permissions";
import { createInternalEstimation, getCrmContact } from "@/lib/admin/crm-contacts";
import type { PropertyEstimationInput } from "@/lib/immo-data";

function isValid(input: Partial<PropertyEstimationInput>): input is PropertyEstimationInput {
  return Boolean(input.address && ["house", "apartment"].includes(input.propertyType ?? "") && Number(input.surfaceM2) > 0 && Number(input.rooms) > 0);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Votre session a expiré." }, { status: 401 });
  if (!(await hasAdminPermission(session, "estimations:read"))) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const { id } = await params;
  const contactResult = await getCrmContact(id, session);
  if (contactResult.status !== "ready" || !contactResult.data) return NextResponse.json({ error: "Fiche CRM inaccessible." }, { status: 404 });
  const input = await request.json().catch(() => null) as Partial<PropertyEstimationInput> | null;
  if (!input || !isValid(input)) return NextResponse.json({ error: "Informations d’estimation invalides." }, { status: 400 });
  const result = await createInternalEstimation(contactResult.data.contact, session, input);
  if (!result.success) return NextResponse.json({ error: result.message }, { status: 500 });
  return NextResponse.json({ ...result.estimation, clientEstimationId: result.id, internal: true, savedToClientAccount: false }, { status: 201 });
}
