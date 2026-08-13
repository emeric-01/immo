import Link from "next/link";
import { ArrowLeft, RotateCcw, Trash2 } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { requireAdminSession } from "@/lib/admin/auth";
import { getDeletedAdminBuyerSearches } from "@/lib/admin/buyer-searches";
import { getDeletedCrmContacts } from "@/lib/admin/crm-contacts";
import { restoreDeletedItemAction } from "./actions";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";
export default async function TrashPage() {
  const session = await requireAdminSession();
  if (session.role === "agent") return <main className={styles.detailPage}><section className={styles.emptyState}><h1>Accès refusé</h1></section></main>;
  const [contacts, searches] = await Promise.all([getDeletedCrmContacts(), getDeletedAdminBuyerSearches()]);
  const crmRows = contacts.status === "ready" ? contacts.data : []; const searchRows = searches.status === "ready" ? searches.data : [];
  return <main className={styles.adminPage}><AdminSidebar active="/admin/clients" session={session}/><section className={styles.content}>
    <Link className={styles.backLink} href="/admin/clients"><ArrowLeft size={18}/>Retour au CRM</Link><header className={styles.pageHeader}><div><p className={styles.eyebrow}>Traçabilité</p><h1><Trash2 size={28}/> Corbeille</h1><p>Éléments supprimés par l’équipe, conservés et restaurables par les administrateurs.</p></div></header>
    <TrashTable kind="crm" rows={crmRows.map((row) => ({ date: row.deleted_at, id: row.id, name: `${row.first_name} ${row.last_name}`, type: "Fiche CRM" }))}/>
    <TrashTable kind="search" rows={searchRows.map((row) => ({ date: row.deleted_at, id: row.id, name: `${row.contact_first_name} ${row.contact_last_name}`, type: "Recherche" }))}/>
  </section></main>;
}
function TrashTable({ kind, rows }: { kind: "crm" | "search"; rows: Array<{ date: string | null; id: string; name: string; type: string }> }) {
  return <section className={styles.infoPanel} data-wide><h2>{kind === "crm" ? "Fiches CRM supprimées" : "Recherches supprimées"}</h2>{rows.length ? <div className={styles.tablePanel}><table><thead><tr><th>Élément</th><th>Supprimé le</th><th/></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><strong>{row.name}</strong><small>{row.type}</small></td><td>{row.date ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(row.date)) : "—"}</td><td><form action={restoreDeletedItemAction}><input name="id" type="hidden" value={row.id}/><input name="kind" type="hidden" value={kind}/><button type="submit"><RotateCcw size={16}/>Restaurer</button></form></td></tr>)}</tbody></table></div> : <p className={styles.mutedText}>Aucun élément supprimé.</p>}</section>;
}
