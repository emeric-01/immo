import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BarChart3, CalendarDays, Euro, Gauge, Home, Mail, MapPin, Ruler, ShieldCheck, UserRound } from "lucide-react";
import { requireAdminSession } from "@/lib/admin/auth";
import { formatAdminClientName } from "@/lib/admin/clients";
import { getAdminEstimation } from "@/lib/admin/estimations";
import styles from "../../admin.module.css";

export const metadata: Metadata = { title: "Détail estimation | Admin" };
export const dynamic = "force-dynamic";

export default async function AdminEstimationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession();
  const { id } = await params;
  const result = await getAdminEstimation(id);
  if (result.status !== "ready" || !result.data) return <Frame><section className={styles.emptyState}><ShieldCheck size={26} /><h1>Estimation indisponible</h1><p>{result.status === "ready" ? "Cette estimation n’existe pas." : result.message}</p></section></Frame>;
  const estimation = result.data;
  return <Frame>
    <section className={styles.detailHero}><Link className={styles.backLink} href="/admin/estimations"><ArrowLeft size={18} />Retour aux estimations</Link><div className={styles.detailHeroGrid}><div><p className={styles.eyebrow}>Estimation du {formatDate(estimation.created_at)}</p><h1>{estimation.address_label}</h1><p>{estimation.property_type === "house" ? "Maison" : "Appartement"} · {estimation.surface_m2} m2 · {estimation.rooms} pièces</p></div>{estimation.client ? <div className={styles.contactBox}><Link href={`/admin/clients/${estimation.client.id}`}><UserRound size={18} />{formatAdminClientName(estimation.client)}</Link><a href={`mailto:${estimation.client.email}`}><Mail size={18} />{estimation.client.email}</a></div> : null}</div></section>
    <section className={styles.detailGrid}>
      <InfoPanel title="Valeur estimée"><Metric icon={Euro} label="Valeur centrale" value={formatCurrency(estimation.median_price)} /><Metric icon={BarChart3} label="Fourchette basse" value={formatCurrency(estimation.low_price)} /><Metric icon={BarChart3} label="Fourchette haute" value={formatCurrency(estimation.high_price)} /><Metric icon={Gauge} label="Confiance" value={`${estimation.confidence_score ?? 0}/5`} /></InfoPanel>
      <InfoPanel title="Caractéristiques"><Metric icon={Home} label="Type" value={estimation.property_type === "house" ? "Maison" : "Appartement"} /><Metric icon={Ruler} label="Surface" value={`${estimation.surface_m2} m2`} /><Metric icon={Euro} label="Prix au m2" value={`${formatNumber(estimation.price_per_m2)} €/m2`} /><Metric icon={MapPin} label="Ville" value={estimation.city_name || estimation.postal_code || "Non renseignée"} /></InfoPanel>
      <InfoPanel title="Suivi"><Metric icon={CalendarDays} label="Création" value={formatDate(estimation.created_at)} /><Metric icon={CalendarDays} label="Mise à jour" value={formatDate(estimation.updated_at)} /><Metric icon={ShieldCheck} label="Statut" value={estimation.status === "active" ? "Active" : "Archivée"} /><Metric icon={Gauge} label="Source" value={estimation.source === "immo-data" ? "Immo Data" : "Mode démonstration"} /></InfoPanel>
    </section>
  </Frame>;
}

function Frame({ children }: { children: React.ReactNode }) { return <main className={styles.detailPage}><div className={styles.detailShell}>{children}</div></main>; }
function InfoPanel({ children, title }: { children: React.ReactNode; title: string }) { return <article className={styles.infoPanel}><h2>{title}</h2>{children}</article>; }
function Metric({ icon: Icon, label, value }: { icon: typeof Home; label: string; value: string }) { return <div className={styles.metricRow}><span><Icon aria-hidden="true" size={18} /></span><div><small>{label}</small><strong>{value}</strong></div></div>; }
function formatCurrency(value: number) { return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value); }
function formatNumber(value: number) { return new Intl.NumberFormat("fr-FR").format(value); }
function formatDate(value: string) { return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
