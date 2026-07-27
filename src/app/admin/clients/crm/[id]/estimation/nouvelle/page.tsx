import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { requireAdminSession } from "@/lib/admin/auth";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { getCrmContact } from "@/lib/admin/crm-contacts";
import { EstimationForm } from "@/app/estimation-form";
import styles from "../../../../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function NewCrmEstimationPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  await requireAdminPermission(session, "estimations:read");
  const { id } = await params;
  const result = await getCrmContact(id, session);
  if (result.status !== "ready" || !result.data) return null;
  const contact = result.data.contact;
  return <><div className={styles.crmFlowBar}><Link href={`/admin/clients/crm/${id}`}><ArrowLeft size={18}/>Retour à la fiche de {contact.first_name}</Link><span>Estimation CRM interne</span></div><div className={styles.paidApiAlert} role="alert"><AlertTriangle size={20}/><div><strong>Attention : estimation payante</strong><p>Chaque estimation lancée appelle une API externe facturée. Vérifiez les informations avant de démarrer le calcul.</p></div></div><EstimationForm crmContactId={id} mode="crm"/></>;
}
