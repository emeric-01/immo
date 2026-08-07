import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BarChart3, Building2, CalendarDays, Clock3, Download, Euro, Gauge, Home, ListChecks, Mail, MapPin, Ruler, ShieldCheck, TrendingUp, UserRound, UsersRound } from "lucide-react";
import { requireAdminSession } from "@/lib/admin/auth";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { formatAdminClientName } from "@/lib/admin/clients";
import { getAdminEstimation } from "@/lib/admin/estimations";
import { formatAdminAttribution, formatAdminAttributionCampaign, formatRecordOrigin } from "@/lib/admin/attribution-display";
import { getAdminUserSummary } from "@/lib/admin/users";
import type { PropertyEstimationInput } from "@/lib/immo-data";
import styles from "../../admin.module.css";
import { EstimationRangeEditor } from "./EstimationRangeEditor";

export const metadata: Metadata = { title: "Détail estimation | Admin" };
export const dynamic = "force-dynamic";

export default async function AdminEstimationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  await requireAdminPermission(session, "estimations:read");
  const { id } = await params;
  const result = await getAdminEstimation(id, session);
  if (result.status !== "ready" || !result.data) return <Frame><section className={styles.emptyState}><ShieldCheck size={26} /><h1>Estimation indisponible</h1><p>{result.status === "ready" ? "Cette estimation n’existe pas." : result.message}</p></section></Frame>;
  const estimation = result.data;
  const assignedAgent = await getAdminUserSummary(estimation.assigned_admin_user_id);
  const attributedAgent = await getAdminUserSummary(estimation.attributed_admin_user_id);
  const creatorAgent = await getAdminUserSummary(estimation.created_by_admin_user_id);
  const commercialAgent = assignedAgent ?? attributedAgent ?? creatorAgent;
  const generatedLowPrice = estimation.generated_low_price ?? estimation.low_price;
  const generatedMedianPrice = estimation.generated_median_price ?? estimation.median_price;
  const generatedHighPrice = estimation.generated_high_price ?? estimation.high_price;
  const input = estimation.input_payload;
  const report = estimation.result_payload;
  return <Frame>
    <section className={styles.detailHero}><div className={styles.detailTopActions}><Link className={styles.backLink} href="/admin/estimations"><ArrowLeft size={18} />Retour aux estimations</Link><a className={styles.primaryButton} href={`/admin/api/estimations/${estimation.id}/pdf`} target="_blank"><Download size={18} />Générer le PDF</a></div><div className={styles.detailHeroGrid}><div><p className={styles.eyebrow}>Estimation du {formatDate(estimation.created_at)}</p><h1>{estimation.address_label}</h1><p>{estimation.property_type === "house" ? "Maison" : "Appartement"} · {estimation.surface_m2} m2 · {estimation.rooms} pièces</p></div>{estimation.client ? <div className={styles.contactBox}><Link href={`/admin/clients/${estimation.client.id}`}><UserRound size={18} />{formatAdminClientName(estimation.client)}</Link><a href={`mailto:${estimation.client.email}`}><Mail size={18} />{estimation.client.email}</a></div> : estimation.crmContact ? <div className={styles.contactBox}><Link href={`/admin/clients/crm/${estimation.crmContact.id}`}><UserRound size={18}/>{estimation.crmContact.first_name} {estimation.crmContact.last_name}</Link><small>Fiche CRM interne — invisible du client</small></div> : <div className={styles.contactBox}><span><UserRound size={18} />Contact non enregistré</span><small>Estimation anonyme, sans compte client.</small></div>}</div></section>
    <EstimationRangeEditor estimationId={estimation.id} generatedHighPrice={generatedHighPrice} generatedLowPrice={generatedLowPrice} generatedMedianPrice={generatedMedianPrice} highPrice={estimation.high_price} lowPrice={estimation.low_price} medianPrice={estimation.median_price} wasAdjusted={Boolean(estimation.range_adjusted)} />
    <section className={styles.detailGrid}>
      <InfoPanel title="Valeur estimée"><Metric icon={Euro} label="Valeur centrale" value={formatCurrency(estimation.median_price)} /><Metric icon={BarChart3} label="Fourchette basse" value={formatCurrency(estimation.low_price)} /><Metric icon={BarChart3} label="Fourchette haute" value={formatCurrency(estimation.high_price)} /><Metric icon={Gauge} label="Confiance" value={`${estimation.confidence_score ?? 0}/5`} /></InfoPanel>
      <InfoPanel title="Caractéristiques"><Metric icon={Home} label="Type" value={estimation.property_type === "house" ? "Maison" : "Appartement"} /><Metric icon={Ruler} label="Surface" value={`${estimation.surface_m2} m2`} /><Metric icon={Building2} label="Pièces" value={`${estimation.rooms}`} /><Metric icon={Euro} label="Prix au m2" value={`${formatNumber(estimation.price_per_m2)} €/m2`} /><Metric icon={MapPin} label="Ville" value={estimation.city_name || estimation.postal_code || "Non renseignée"} /></InfoPanel>
      <InfoPanel title="Détails pris en compte"><Metric icon={ListChecks} label="État" value={formatCondition(input.condition)} /><Metric icon={CalendarDays} label="Construction" value={input.constructionYear ? String(input.constructionYear) : "Non renseignée"} /><Metric icon={Home} label="Terrain" value={input.landAreaM2 !== undefined ? `${input.landAreaM2} m2` : "Non applicable"} /><Metric icon={Building2} label="Salle(s) de bain" value={input.bathrooms !== undefined ? String(input.bathrooms) : "Non renseigné"} /><div className={styles.tagGrid}>{featureLabels(input).map((label) => <span key={label}>{label}</span>)}</div></InfoPanel>
      <InfoPanel title="Lecture du marché"><Metric icon={TrendingUp} label="Prix moyen du secteur" value={report.market?.sectorPricePerM2 ? `${formatNumber(report.market.sectorPricePerM2)} €/m2` : "Non disponible"} /><Metric icon={TrendingUp} label="Évolution sur 12 mois" value={report.market?.priceEvolution12Months !== undefined ? `${report.market.priceEvolution12Months > 0 ? "+" : ""}${report.market.priceEvolution12Months} %` : "Non disponible"} /><Metric icon={Clock3} label="Délai de vente" value={report.market?.saleDurationDays ? `${report.market.saleDurationDays} jours` : "Non disponible"} /><Metric icon={Gauge} label="Demande" value={report.market?.demandLevel ?? "Non disponible"} /></InfoPanel>
      <InfoPanel title={`Ventes comparables (${report.comparables.length})`} wide>{report.comparables.length ? <div className={styles.adminComparableList}>{report.comparables.map((sale) => <article key={sale.id}><div><strong>{sale.label}</strong><span>{sale.surfaceM2 ? `${sale.surfaceM2} m2` : "Surface NC"} · {sale.rooms ? `${sale.rooms} pièces` : "Pièces NC"} · {sale.distanceMeters !== undefined ? formatDistance(sale.distanceMeters) : "Distance NC"}</span></div><div><strong>{formatCurrency(sale.price)}</strong><span>{sale.pricePerM2 ? `${formatNumber(sale.pricePerM2)} €/m2` : "Prix/m2 NC"} · {sale.soldAt ? formatShortDate(sale.soldAt) : "Date NC"}</span></div></article>)}</div> : <p className={styles.helpText}>Aucune transaction comparable n’a été retournée pour cette adresse.</p>}</InfoPanel>
      <InfoPanel title="Suivi"><Metric icon={CalendarDays} label="Création" value={formatDate(estimation.created_at)} /><Metric icon={CalendarDays} label="Mise à jour" value={formatDate(estimation.updated_at)} /><Metric icon={ShieldCheck} label="Statut" value={estimation.status === "active" ? "Active" : "Archivée"} /><Metric icon={Gauge} label="Source" value={estimation.source === "immo-data" ? "Immo Data" : "Mode démonstration"} /></InfoPanel>
      <InfoPanel title="Attribution commerciale"><Metric icon={UsersRound} label="Agent commercial" value={commercialAgent?.full_name ?? "Aucun agent attribué"} /><Metric icon={Mail} label="E-mail de l’agent" value={commercialAgent?.email ?? "Non renseigné"} /><Metric icon={ShieldCheck} label="Mode de création" value={formatRecordOrigin(estimation.record_origin)} /><Metric icon={ShieldCheck} label="Origine" value={formatAdminAttribution(estimation.attribution_snapshot)} /><Metric icon={Gauge} label="Campagne" value={formatAdminAttributionCampaign(estimation.attribution_snapshot)} /></InfoPanel>
    </section>
  </Frame>;
}

function Frame({ children }: { children: React.ReactNode }) { return <main className={styles.detailPage}><div className={styles.detailShell}>{children}</div></main>; }
function InfoPanel({ children, title, wide = false }: { children: React.ReactNode; title: string; wide?: boolean }) { return <article className={styles.infoPanel} data-wide={wide || undefined}><h2>{title}</h2>{children}</article>; }
function Metric({ icon: Icon, label, value }: { icon: typeof Home; label: string; value: string }) { return <div className={styles.metricRow}><span><Icon aria-hidden="true" size={18} /></span><div><small>{label}</small><strong>{value}</strong></div></div>; }
function formatCurrency(value: number) { return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value); }
function formatNumber(value: number) { return new Intl.NumberFormat("fr-FR").format(value); }
function formatDate(value: string) { return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function formatShortDate(value: string) { return new Intl.DateTimeFormat("fr-FR", { month: "2-digit", year: "numeric" }).format(new Date(value)); }
function formatDistance(value: number) { return value >= 1000 ? `${(value / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} km` : `${formatNumber(value)} m`; }
function formatCondition(value: string | undefined) { return ({ new: "Excellent état", good: "Bon état", refresh: "À rafraîchir", renovate: "À rénover" } as Record<string, string>)[value ?? ""] ?? "Non renseigné"; }
function featureLabels(input: PropertyEstimationInput) {
  const labels: string[] = [];
  if (input.hasOutdoorSpace) labels.push("Extérieur");
  if (input.hasParking) labels.push("Parking");
  if (input.hasCellar) labels.push("Cave");
  if (input.hasNiceView) labels.push("Belle vue");
  if (input.hasElevator) labels.push("Ascenseur");
  if (input.hasPool) labels.push("Piscine");
  if (input.dpe) labels.push(`DPE ${input.dpe}`);
  return labels;
}
