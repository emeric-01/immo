import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { EstimationForm } from "@/app/estimation-form";
import { requireAdminSession } from "@/lib/admin/auth";
import { requireAdminPermission } from "@/lib/admin/permissions";
import styles from "../../admin.module.css";

export const metadata: Metadata = { title: "Nouvelle estimation | Admin" };
export const dynamic = "force-dynamic";

export default async function NewAdminEstimationPage() {
  const session = await requireAdminSession();
  await requireAdminPermission(session, "estimations:read");

  return <>
    <div className={styles.crmFlowBar}>
      <Link href="/admin/estimations"><ArrowLeft size={18} />Retour aux estimations</Link>
      <span>Étude professionnelle interne</span>
    </div>
    <div className={styles.paidApiAlert} role="alert">
      <AlertTriangle size={20} />
      <div>
        <strong>Estimation complète facturée par l’API</strong>
        <p>Vérifiez l’adresse et les caractéristiques. Le résultat sera enregistré dans le back-office et restera modifiable avant présentation.</p>
      </div>
    </div>
    <EstimationForm mode="admin" />
  </>;
}
