import Link from "next/link";
import { Bot, Eye, MousePointerClick, ShieldCheck, UsersRound } from "lucide-react";
import { requireAdminSession } from "@/lib/admin/auth";
import { getSiteAnalytics } from "@/lib/site-analytics";
import admin from "../admin.module.css";
import styles from "./audience.module.css";
import { AudienceCharts } from "./AudienceCharts";

export const dynamic = "force-dynamic";

export default async function AudiencePage({ searchParams }: { searchParams: Promise<{ periode?: string }> }) {
  await requireAdminSession();
  const requested = Number((await searchParams).periode || 30);
  const days = [7, 30, 90].includes(requested) ? requested : 30;
  const summary = await getSiteAnalytics(days).catch(() => ({ totals: { humanViews: 0, botViews: 0, suspectedViews: 0, uniqueVisitors: 0, conversions: 0, conversionRate: 0 }, daily: [], audience: [], devices: [], pages: [], sources: [], bots: [] }));
  const deviceLabel = (name: string) => name === "mobile" ? "Mobile" : name === "tablet" ? "Tablette" : "Ordinateur";
  return <main className={admin.adminPage}>
    <aside className={admin.sidebar}><div className={admin.brandMark}><span>les jumelles</span><strong>IMMO</strong></div><nav><Link href="/admin/biens">Biens</Link><Link href="/admin/recherches">Recherches</Link><Link href="/admin/estimations">Estimations</Link><Link href="/admin/parrainages">Parrainages</Link><Link href="/admin/clients">Clients</Link><Link href="/admin/recherches-villes">Villes recherchées</Link><Link data-active href="/admin/audience">Audience</Link><Link href="/admin/contenus">Contenus</Link><Link href="/admin/utilisateurs">Utilisateurs</Link></nav></aside>
    <section className={admin.content}><header className={admin.pageHeader}><div><p className={admin.eyebrow}>Mesure d’audience</p><h1>Trafic du site</h1><p>Une lecture claire des visites, des parcours et du trafic automatisé identifié.</p></div></header>
      <div className={styles.filters}><div>{[7, 30, 90].map((period) => <Link data-active={period === days ? "" : undefined} href={`/admin/audience?periode=${period}`} key={period}>{period} jours</Link>)}</div></div>
      <section className={styles.metrics}><article><Eye/><span>Pages vues humaines</span><strong>{summary.totals.humanViews}</strong><small>sur {days} jours</small></article><article><UsersRound/><span>Visiteurs estimés</span><strong>{summary.totals.uniqueVisitors}</strong><small>identifiants pseudonymisés</small></article><article><Bot/><span>Robots identifiés</span><strong>{summary.totals.botViews}</strong><small>pages interrogées</small></article><article><MousePointerClick/><span>Conversions</span><strong>{summary.totals.conversions}</strong><small>{summary.totals.conversionRate}% des vues</small></article><article><ShieldCheck/><span>Trafic incertain</span><strong>{summary.totals.suspectedViews}</strong><small>à surveiller</small></article></section>
      <AudienceCharts summary={summary}/>
      <section className={styles.tables}><article className={styles.listCard}><span>Contenus</span><h2>Pages les plus consultées</h2><div className={styles.list}>{summary.pages.length ? summary.pages.map((item) => <div key={item.name}><span>{item.name}</span><strong>{item.value}</strong></div>) : <p className={styles.empty}>Pas encore de données.</p>}</div></article><article className={styles.listCard}><span>Acquisition</span><h2>Principales sources</h2><div className={styles.list}>{summary.sources.length ? summary.sources.map((item) => <div key={item.name}><span>{item.name}</span><strong>{item.value}</strong></div>) : <p className={styles.empty}>Pas encore de données.</p>}</div></article><article className={styles.listCard}><span>Appareils</span><h2>Supports utilisés</h2><div className={styles.list}>{summary.devices.length ? summary.devices.map((item) => <div key={item.name}><span>{deviceLabel(item.name)}</span><strong>{item.value}</strong></div>) : <p className={styles.empty}>Pas encore de données.</p>}</div></article></section>
      {summary.bots.length ? <article className={styles.listCard}><span>Robots</span><h2>Robots les plus actifs</h2><div className={styles.list}>{summary.bots.map((item) => <div key={item.name}><span>{item.name}</span><strong>{item.value}</strong></div>)}</div></article> : null}
      <p className={styles.note}>La distinction repose sur les signatures techniques connues des navigateurs et robots. Elle est utile pour piloter le site, mais ne constitue pas une preuve absolue : certains robots avancés peuvent imiter un navigateur humain.</p>
    </section>
  </main>;
}
