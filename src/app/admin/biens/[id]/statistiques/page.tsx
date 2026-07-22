import Link from "next/link";
import { ArrowLeft, Eye, MousePointerClick, TrendingUp, UserRound } from "lucide-react";
import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/admin/auth";
import { getPropertyAnalytics } from "@/lib/property-analytics";
import { getAdminProperty } from "@/lib/properties";
import admin from "../../../admin.module.css";
import styles from "./analytics.module.css";
import { PropertyAnalyticsCharts } from "./PropertyAnalyticsCharts";

export const dynamic = "force-dynamic";

const emptySummary = {
  totalViews: 0,
  uniqueVisitors: 0,
  views7Days: 0,
  views30Days: 0,
  contacts: 0,
  conversionRate: 0,
  daily: [],
  devices: [],
  sources: [],
  actions: { visitRequests: 0, phoneClicks: 0, emailClicks: 0 },
};

export default async function PropertyStatisticsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession();
  const { id } = await params;
  const property = await getAdminProperty(id).catch(() => null);
  if (!property) notFound();
  const summary = await getPropertyAnalytics(id).catch(() => emptySummary);
  return <main className={admin.adminPage}><aside className={admin.sidebar}><div className={admin.brandMark}><span>les jumelles</span><strong>IMMO</strong></div><nav><Link data-active href="/admin/biens">Biens</Link><Link href="/admin/recherches">Recherches</Link><Link href="/admin/estimations">Estimations</Link><Link href="/admin/parrainages">Parrainages</Link><Link href="/admin/clients">Clients</Link><Link href="/admin/recherches-villes">Villes recherchées</Link><Link href="/admin/contenus">Contenus</Link></nav></aside><section className={admin.content}><Link className={styles.back} href="/admin/biens"><ArrowLeft size={16}/> Retour aux biens</Link><header className={admin.pageHeader}><div><p className={admin.eyebrow}>Performance de l’annonce</p><h1>{property.title}</h1><p>Vues anonymisées, intérêt généré et actions de contact.</p></div><div className={admin.headerActions}><Link className={admin.secondaryButton} href={`/admin/biens/${property.id}`}>Modifier</Link><Link className={admin.secondaryButton} href={`/biens/${property.slug}`} target="_blank">Voir l’annonce</Link></div></header><section className={styles.metrics}><article><Eye/><span>Vues totales</span><strong>{summary.totalViews}</strong><small>{summary.views30Days} sur 30 jours</small></article><article><UserRound/><span>Visiteurs uniques</span><strong>{summary.uniqueVisitors}</strong><small>Anonymisés</small></article><article><TrendingUp/><span>7 derniers jours</span><strong>{summary.views7Days}</strong><small>vues</small></article><article><MousePointerClick/><span>Actions de contact</span><strong>{summary.contacts}</strong><small>clics qualifiés</small></article><article><TrendingUp/><span>Conversion</span><strong>{summary.conversionRate}%</strong><small>contacts / vues</small></article></section><PropertyAnalyticsCharts summary={summary}/><section className={styles.details}><article className={styles.detailCard}><span>Intentions</span><h2>Actions des visiteurs</h2><div className={styles.actionGrid}><div><strong>{summary.actions.visitRequests}</strong><small>Demandes de visite</small></div><div><strong>{summary.actions.phoneClicks}</strong><small>Clics téléphone</small></div><div><strong>{summary.actions.emailClicks}</strong><small>Clics email</small></div></div></article><article className={styles.detailCard}><span>Acquisition</span><h2>Principales sources</h2><div className={styles.sourceList}>{summary.sources.length?summary.sources.map(source=><div key={source.name}><span>{source.name}</span><strong>{source.value}</strong></div>):<p>Les sources apparaîtront après les premières visites.</p>}</div></article></section></section></main>;
}
