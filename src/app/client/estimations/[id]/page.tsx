import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BarChart3, Building2, CalendarDays, Gauge, MapPin, Ruler } from "lucide-react";
import { requireClientSession } from "@/lib/client-access/auth";
import { getClientEstimation } from "@/lib/client-access/estimations";
import styles from "../../client.module.css";

export const metadata: Metadata = { title: "Mon estimation | Les Jumelles Immo" };
export const dynamic = "force-dynamic";

export default async function ClientEstimationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireClientSession();
  const { id } = await params;
  const estimation = await getClientEstimation(session, id);

  if (!estimation) {
    return (
      <main className={styles.clientPage}><section className={styles.shell}>
        <Link className={styles.backLink} href="/client"><ArrowLeft size={17} /> Retour à mon espace</Link>
        <section className={styles.emptyState}><h1>Estimation indisponible</h1><p>Cette estimation n&apos;existe pas ou ne vous appartient pas.</p></section>
      </section></main>
    );
  }

  const result = estimation.result_payload;

  return (
    <main className={styles.clientPage}>
      <section className={styles.shell}>
        <Link className={styles.backLink} href="/client"><ArrowLeft size={17} /> Retour à mon espace</Link>
        <header className={styles.detailHeader}>
          <div><p className={styles.eyebrow}>Estimation du {formatDate(estimation.created_at)}</p><h1>{estimation.address_label}</h1><p>{estimation.property_type === "house" ? "Maison" : "Appartement"} · {estimation.surface_m2} m2</p></div>
          <Link className={styles.secondaryButton} href="/">Nouvelle estimation</Link>
        </header>
        <section className={styles.estimateHero}>
          <p>Valeur estimée</p>
          <strong>{formatCurrency(estimation.median_price)}</strong>
          <span>Fourchette de {formatCurrency(estimation.low_price)} à {formatCurrency(estimation.high_price)}</span>
        </section>
        <section className={styles.estimateMetrics}>
          <Metric icon={Building2} label="Type" value={estimation.property_type === "house" ? "Maison" : "Appartement"} />
          <Metric icon={Ruler} label="Surface" value={`${estimation.surface_m2} m2`} />
          <Metric icon={BarChart3} label="Prix au m2" value={`${formatNumber(estimation.price_per_m2)} €/m2`} />
          <Metric icon={Gauge} label="Confiance" value={`${estimation.confidence_score ?? 0}/5`} />
          <Metric icon={MapPin} label="Localisation" value={estimation.city_name || estimation.address_label} />
          <Metric icon={CalendarDays} label="Mise à jour" value={formatDate(estimation.updated_at)} />
        </section>
        {result.marketSignals.length > 0 ? (
          <section className={styles.dashboardSection}><div className={styles.sectionTitle}><div><p className={styles.eyebrow}>Analyse</p><h2>Signaux de marché</h2></div></div><ul className={styles.signalList}>{result.marketSignals.map((signal) => <li key={signal}>{signal}</li>)}</ul></section>
        ) : null}
      </section>
    </main>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) {
  return <div className={styles.estimateMetric}><Icon size={19} /><span>{label}</span><strong>{value}</strong></div>;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-FR", { currency: "EUR", maximumFractionDigits: 0, style: "currency" }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(value));
}
