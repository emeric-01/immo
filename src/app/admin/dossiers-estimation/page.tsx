import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, FileCheck2, FilePenLine } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { requireAdminSession } from "@/lib/admin/auth";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { getEstimationAgentWorkspaces } from "@/lib/admin/estimation-workspaces";
import styles from "../admin.module.css";

export const metadata: Metadata = { title: "Dossiers d’estimation | Admin" };
export const dynamic = "force-dynamic";

export default async function EstimationWorkspacesPage() {
  const session = await requireAdminSession(); await requireAdminPermission(session, "estimations:read");
  const dossiers = await getEstimationAgentWorkspaces(session);
  return <main className={styles.adminPage}><AdminSidebar active="/admin/dossiers-estimation" session={session} /><section className={styles.content}><header className={styles.pageHeader}><div><p className={styles.eyebrow}>Travail des agents</p><h1>Dossiers d’estimation</h1><p>Retrouvez les analyses professionnelles créées à partir des estimations automatiques, sans modifier les données initiales des clients.</p></div></header><section className={styles.statsGrid}><Stat icon={BriefcaseBusiness} label="Dossiers" value={dossiers.length} /><Stat icon={FilePenLine} label="En préparation" value={dossiers.filter(({ workspace }) => workspace.status === "draft").length} /><Stat icon={FileCheck2} label="Prêts" value={dossiers.filter(({ workspace }) => workspace.status === "ready").length} /></section><div className={styles.tablePanel}><table><thead><tr><th>Dossier</th><th>Bien source</th><th>Positionnement agent</th><th>État</th><th>Mise à jour</th><th aria-label="Ouvrir" /></tr></thead><tbody>{dossiers.map(({ source, workspace }) => <tr key={workspace.id}><td><strong>{workspace.title}</strong><small>Dossier professionnel distinct</small></td><td><strong>{source.address_label}</strong><small>{source.property_type === "house" ? "Maison" : "Appartement"} · {source.surface_m2} m² · {source.rooms} pièces</small></td><td><strong>{currency(workspace.median_price)}</strong><small>{currency(workspace.low_price)} - {currency(workspace.high_price)}</small></td><td><span className={styles.statusBadge} data-status={workspace.status === "ready" ? "matched" : "paused"}>{workspace.status === "ready" ? "Prêt" : workspace.status === "archived" ? "Archivé" : "Brouillon"}</span></td><td>{date(workspace.updated_at)}</td><td><Link aria-label={`Ouvrir ${workspace.title}`} className={styles.iconLink} href={`/admin/estimations/${source.id}/dossier`}><ArrowRight size={18} /></Link></td></tr>)}</tbody></table>{dossiers.length === 0 ? <div className={styles.emptyState}><BriefcaseBusiness size={26} /><h2>Aucun dossier professionnel</h2><p>Ouvrez une estimation automatique puis sélectionnez « Créer le dossier professionnel ».</p></div> : null}</div></section></main>;
}

function Stat({ icon: Icon, label, value }: { icon: typeof BriefcaseBusiness; label: string; value: number }) { return <article className={styles.statCard}><span><Icon size={20} /></span><div><small>{label}</small><strong>{value}</strong></div></article>; }
function currency(value: number) { return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value); }
function date(value: string) { return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(value)); }
