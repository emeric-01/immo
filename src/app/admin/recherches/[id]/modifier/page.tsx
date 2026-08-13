import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BuyerSearchWizard } from "@/components/buyer-search/wizard/BuyerSearchWizard";
import { requireAdminSession } from "@/lib/admin/auth";
import { getAdminBuyerSearch } from "@/lib/admin/buyer-searches";
import { hasAdminPermission, requireAdminPermission } from "@/lib/admin/permissions";
import styles from "../../../admin.module.css";

export const dynamic = "force-dynamic";
export default async function EditSearchPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession(); await requireAdminPermission(session, "buyer_searches:read"); const { id } = await params;
  const result = await getAdminBuyerSearch(id, session); if (result.status !== "ready" || !result.data) notFound(); const search = result.data.search;
  const owns = search.created_by_admin_user_id === session.id || search.assigned_admin_user_id === session.id || search.attributed_admin_user_id === session.id;
  if (session.role === "agent" && (!(await hasAdminPermission(session, "buyer_searches:update_own")) || !owns)) notFound();
  return <><div className={styles.crmFlowBar}><Link href={`/admin/recherches/${id}`}><ArrowLeft size={18}/>Retour à la recherche</Link><span>Modification interne</span></div><BuyerSearchWizard initialData={search.raw_payload} mode="admin-edit" searchId={id}/></>;
}
