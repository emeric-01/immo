import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BedDouble, CalendarDays, Euro, Home, MapPin, Ruler } from "lucide-react";
import { MarketScoreCard } from "@/components/buyer-search/MarketScoreCard";
import { optionLabel, propertyTypeLabels, purchaseTimelineOptions } from "@/lib/buyer-search/options";
import type { BuyerSearchFormData } from "@/lib/buyer-search/types";
import { requireClientSession } from "@/lib/client-access/auth";
import { getClientBuyerSearch, type ClientBuyerSearchRow } from "@/lib/client-access/project";
import { DeleteSearchButton } from "../../DeleteSearchButton";
import styles from "../../client.module.css";

export const metadata: Metadata = { title: "Ma recherche | Les Jumelles Immo" };
export const dynamic = "force-dynamic";

export default async function ClientSearchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireClientSession();
  const { id } = await params;
  const result = await getClientBuyerSearch(session, id);

  if (result.status !== "ready") {
    return (
      <main className={styles.clientPage}>
        <section className={styles.shell}>
          <Link className={styles.backLink} href="/client"><ArrowLeft size={17} /> Retour à mon espace</Link>
          <section className={styles.emptyState}><h1>Recherche indisponible</h1><p>{result.message}</p></section>
        </section>
      </main>
    );
  }

  return <SearchDetail search={result.data} />;
}

function SearchDetail({ search }: { search: ClientBuyerSearchRow }) {
  const data = search.raw_payload;

  return (
    <main className={styles.clientPage}>
      <section className={styles.shell}>
        <Link className={styles.backLink} href="/client"><ArrowLeft size={17} /> Retour à mon espace</Link>
        <header className={styles.detailHeader}>
          <div><p className={styles.eyebrow}>Recherche du {formatDate(search.created_at)}</p><h1>Mon projet d&apos;achat</h1><p>{search.location_summary}</p></div>
          <div className={styles.detailActions}>
            <DeleteSearchButton searchId={search.id} />
            <Link className={styles.primaryButton} href={`/recherche?source=client&searchId=${search.id}`}>Modifier cette recherche <ArrowRight size={18} /></Link>
          </div>
        </header>
        <section className={styles.detailGrid}>
          <article className={styles.summaryPanel}>
            <h2>Résumé de recherche</h2>
            <div className={styles.metricList}>
              <Metric icon={Home} label="Type de bien" value={formatPropertyTypes(search.property_types)} />
              <Metric icon={MapPin} label="Localisation" value={search.location_summary || formatLocationSummary(data)} />
              <Metric icon={Euro} label="Budget maximum" value={formatCurrency(search.maximum_budget ?? data.property.maximumBudget)} />
              <Metric icon={Ruler} label="Surface minimale" value={`${search.minimum_living_area ?? data.characteristics.minimumLivingArea ?? 0} m2`} />
              {search.minimum_land_area ?? data.preferences.minimumLandArea ? <Metric icon={Ruler} label="Terrain minimum" value={`${search.minimum_land_area ?? data.preferences.minimumLandArea} m2`} /> : null}
              <Metric icon={BedDouble} label="Chambres min." value={`${search.minimum_bedrooms ?? data.characteristics.minimumBedrooms ?? 0}`} />
              <Metric icon={CalendarDays} label="Délai d'achat" value={optionLabel(purchaseTimelineOptions, search.purchase_timeline ?? data.project.purchaseTimeline) || "Non renseigné"} />
            </div>
          </article>
          {search.market_score_payload ? <MarketScoreCard score={search.market_score_payload} /> : null}
        </section>
      </section>
    </main>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Home; label: string; value: string }) {
  return <div className={styles.metricRow}><span className={styles.metricIcon}><Icon size={18} /></span><div><small>{label}</small><strong>{value || "Non renseigné"}</strong></div></div>;
}

function formatPropertyTypes(types: ClientBuyerSearchRow["property_types"]) {
  return types.length > 0 ? types.map((type) => propertyTypeLabels[type]).join(", ") : "Non renseigné";
}

function formatCurrency(value: number | null) {
  return value ? new Intl.NumberFormat("fr-FR", { currency: "EUR", maximumFractionDigits: 0, style: "currency" }).format(value) : "Non renseigné";
}

function formatLocationSummary(data: BuyerSearchFormData) {
  return data.location.cities.map((city) => `${city.name} (${city.radiusKm ?? 2} km)`).join(", ") || "Non renseigné";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(value));
}
