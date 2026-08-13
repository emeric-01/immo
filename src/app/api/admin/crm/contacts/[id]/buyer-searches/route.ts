import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { hasAdminPermission } from "@/lib/admin/permissions";
import { buyerSearchSchema, stepSchemas } from "@/lib/buyer-search/schema";
import { createInternalBuyerSearch, getCrmContact } from "@/lib/admin/crm-contacts";
import { sendBuyerSearchCreatedEmails } from "@/lib/email/buyer-search-emails";

const internalSteps = ["location", "property", "characteristics", "preferences", "project", "priorities"] as const;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Votre session a expiré." }, { status: 401 });
  if (!(await hasAdminPermission(session, "buyer_searches:read"))) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const { id } = await params;
  const contactResult = await getCrmContact(id, session);
  if (contactResult.status !== "ready" || !contactResult.data) return NextResponse.json({ error: "Fiche CRM inaccessible." }, { status: 404 });
  const payload = await request.json().catch(() => null);
  const parsed = buyerSearchSchema.safeParse(payload);
  if (!parsed.success || internalSteps.some((step) => !stepSchemas[step].safeParse(parsed.success ? parsed.data[step] : null).success)) {
    return NextResponse.json({ error: "Certaines informations de la recherche sont invalides." }, { status: 400 });
  }
  const result = await createInternalBuyerSearch(contactResult.data.contact, session, parsed.data);
  if (!result.success) return NextResponse.json({ error: result.message }, { status: 500 });
  const contact = contactResult.data.contact;
  const notification = await sendBuyerSearchCreatedEmails({
    data: {
      ...parsed.data,
      contact: {
        ...parsed.data.contact,
        consent: false,
        email: contact.email,
        firstName: contact.first_name,
        lastName: contact.last_name,
        phone: contact.phone,
      },
    },
    result: { id: result.id, persisted: true, storage: "database" },
  });
  return NextResponse.json({ id: result.id, internal: true, marketScore: result.marketScore, warnings: notification.warnings }, { status: 201 });
}
