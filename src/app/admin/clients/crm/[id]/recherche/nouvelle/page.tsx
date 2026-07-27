import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdminSession } from "@/lib/admin/auth";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { getCrmContact } from "@/lib/admin/crm-contacts";
import { BuyerSearchWizard } from "@/components/buyer-search/wizard/BuyerSearchWizard";
import { defaultBuyerSearchData } from "@/lib/buyer-search/types";
import styles from "../../../../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function NewCrmSearchPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  await requireAdminPermission(session, "buyer_searches:read");
  const { id } = await params;
  const result = await getCrmContact(id, session);
  if (result.status !== "ready" || !result.data) return null;
  const contact = result.data.contact;
  const initialData = { ...defaultBuyerSearchData, contact: { ...defaultBuyerSearchData.contact, email: contact.email, firstName: contact.first_name, lastName: contact.last_name, phone: contact.phone } };
  return <><div className={styles.crmFlowBar}><Link href={`/admin/clients/crm/${id}`}><ArrowLeft size={18}/>Retour à la fiche de {contact.first_name}</Link><span>Recherche CRM interne</span></div><BuyerSearchWizard crmContactId={id} initialData={initialData} mode="crm"/></>;
}
