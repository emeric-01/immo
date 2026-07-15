import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, CalendarClock, Euro, Gauge, Inbox, Search, UserRound } from "lucide-react";
import { requireAdminSession } from "@/lib/admin/auth";
import { formatAdminClientName } from "@/lib/admin/clients";
import { getAdminEstimations, getAdminEstimationStats, type AdminEstimation } from "@/lib/admin/estimations";
import { logoutAdmin } from "../login/actions";
import styles from "../admin.module.css";

export const metadata: Metadata = { title: "Estimations | Admin" };
export const dynamic = "force-dynamic";

export default async function AdminEstimationsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  await requireAdminSession();
  const params = await searchParams;
  const result = await getAdminEstimations(params);

  return (
    <main className={styles.adminPage}>
      <Sidebar />
      <section className={styles.content}>
        <section className={styles.pageHeader}>
          <div><p className={styles.eyebrow}>Estimations vendeurs</p><h1>Demandes d&apos;estimation</h1><p>Consultez les biens estimés, leur valeur et les comptes clients associés.</p></div>
          <form action={logoutAdmin}><button className={styles.secondaryButton} type="submit">Deconnexion</button></form>
        </section>
        {result.status !== "ready" ? <EmptyState title="Lecture BDD a finaliser" text={result.message} /> : <EstimationContent rows={result.data} params={params} />}
      </section>
    </main>
  );
}

function Sidebar() {
  return <aside className={styles.sidebar}><div className={styles.brandMark}><span>les jumelles</span><strong>IMMO</strong></div><nav><Link href="/admin/recherches">Recherches</Link><Link data-active href="/admin/estimations">Estimations</Link><Link href="/admin/clients">Clients</Link><Link href="/admin/utilisateurs">Utilisateurs</Link></nav></aside>;
}

function EstimationContent({ rows, params }: { rows: AdminEstimation[]; params: { q?: string; status?: string } }) {
  const stats = getAdminEstimationStats(rows);
  const cards = [
    { icon: BarChart3, label: "Estimations", value: stats.total },
    { icon: Gauge, label: "Actives", value: stats.activeCount },
    { icon: UserRound, label: "Clients", value: stats.uniqueClients },
    { icon: CalendarClock, label: "7 derniers jours", value: stats.recentCount },
    { icon: Euro, label: "Valeur moyenne", value: formatCurrency(stats.averagePrice) },
  ];
  return <>
    <div className={styles.statsGrid}>{cards.map((card) => <article className={styles.statCard} key={card.label}><span><card.icon aria-hidden="true" size={18} /></span><p>{card.label}</p><strong>{card.value}</strong></article>)}</div>
    <form className={styles.filterBar}><label className={styles.searchField}><Search aria-hidden="true" size={18} /><input defaultValue={params.q ?? ""} name="q" placeholder="Rechercher client, email, adresse, ville..." /></label><select defaultValue={params.status ?? "all"} name="status"><option value="all">Tous les statuts</option><option value="active">Active</option><option value="archived">Archivée</option></select><button type="submit">Filtrer</button></form>
    {rows.length ? <EstimationTable rows={rows} /> : <EmptyState title="Aucune estimation" text="Aucune estimation ne correspond aux filtres actuels." />}
  </>;
}

function EstimationTable({ rows }: { rows: AdminEstimation[] }) {
  return <div className={styles.tablePanel}><table><thead><tr><th>Client</th><th>Bien</th><th>Estimation</th><th>Confiance</th><th>Date</th><th aria-label="Detail" /></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><div className={styles.clientCell}><span><UserRound aria-hidden="true" size={18} /></span><div><strong>{row.client ? formatAdminClientName(row.client) : "Client inconnu"}</strong><small>{row.client?.email ?? "Compte indisponible"}</small></div></div></td><td><strong>{row.property_type === "house" ? "Maison" : "Appartement"}</strong><small>{row.address_label}</small><small>{row.surface_m2} m2 · {row.rooms} pièces</small></td><td><strong>{formatCurrency(row.median_price)}</strong><small>{formatCurrency(row.low_price)} – {formatCurrency(row.high_price)}</small></td><td><span className={styles.marketScoreBadge} data-score={confidenceTone(row.confidence_score)}>{row.confidence_score ?? 0}/5</span><small>{row.source === "immo-data" ? "Immo Data" : "Démonstration"}</small></td><td><strong>{formatDate(row.created_at)}</strong><small><span className={styles.statusBadge} data-status={row.status === "active" ? "matched" : "paused"}>{row.status === "active" ? "Active" : "Archivée"}</span></small></td><td><Link aria-label={`Voir l'estimation de ${row.address_label}`} className={styles.iconLink} href={`/admin/estimations/${row.id}`}><ArrowRight aria-hidden="true" size={18} /></Link></td></tr>)}</tbody></table></div>;
}

function EmptyState({ title, text }: { title: string; text: string }) { return <section className={styles.emptyState}><Inbox aria-hidden="true" size={26} /><h2>{title}</h2><p>{text}</p></section>; }
function formatCurrency(value: number) { return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value); }
function formatDate(value: string) { return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function confidenceTone(value: number | null) { return (value ?? 0) >= 4 ? "positive" : (value ?? 0) >= 3 ? "warning" : "difficult"; }
