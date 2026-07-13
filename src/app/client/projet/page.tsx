import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BedDouble, CalendarDays, Euro, Home, LogOut, MapPin, Ruler } from "lucide-react";
import { optionLabel, propertyTypeLabels, purchaseTimelineOptions } from "@/lib/buyer-search/options";
import type { BuyerSearchFormData } from "@/lib/buyer-search/types";
import { requireClientSession } from "@/lib/client-access/auth";
import { getClientBuyerSearch, type ClientBuyerSearchRow } from "@/lib/client-access/project";
import { logoutClient } from "../login/actions";
import styles from "../client.module.css";

export const metadata: Metadata = {
  title: "Mon projet | Les Jumelles Immo",
};

export const dynamic = "force-dynamic";

export default async function ClientProjectPage() {
  const session = await requireClientSession();
  const result = await getClientBuyerSearch(session);

  return (
    <main className={styles.clientPage}>
      <section className={styles.shell}>
        <Link className={styles.brandMark} href="/">
          <span>les jumelles</span>
          <strong>IMMO</strong>
        </Link>
        {result.status === "ready" ? <ProjectView search={result.data} /> : <ProjectEmpty message={result.message} />}
      </section>
    </main>
  );
}

function ProjectView({ search }: { search: ClientBuyerSearchRow }) {
  const data = search.raw_payload;

  return (
    <>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Espace client</p>
          <h1>Votre projet immobilier</h1>
          <p>
            Retrouvez votre recherche, vos secteurs et vos criteres. Vous pouvez la modifier puis la reenregistrer a tout moment.
          </p>
        </div>
        <form action={logoutClient}>
          <button className={styles.secondaryButton} type="submit">
            <LogOut size={18} aria-hidden="true" />
            Deconnexion
          </button>
        </form>
      </header>
      <section className={styles.grid}>
        <article className={styles.summaryPanel}>
          <h2>Resume de recherche</h2>
          <div className={styles.metricList}>
            <Metric icon={Home} label="Type de bien" value={formatPropertyTypes(search.property_types)} />
            <Metric icon={MapPin} label="Localisation" value={search.location_summary || formatLocationSummary(data)} />
            <Metric icon={Euro} label="Budget maximum" value={formatCurrency(search.maximum_budget ?? data.property.maximumBudget)} />
            <Metric icon={Ruler} label="Surface minimale" value={`${search.minimum_living_area ?? data.characteristics.minimumLivingArea ?? 0} m2`} />
            <Metric icon={BedDouble} label="Chambres min." value={`${search.minimum_bedrooms ?? data.characteristics.minimumBedrooms ?? 0}`} />
            <Metric
              icon={CalendarDays}
              label="Delai d'achat"
              value={optionLabel(purchaseTimelineOptions, search.purchase_timeline ?? data.project.purchaseTimeline) || "Non renseigne"}
            />
          </div>
        </article>
        <aside className={styles.infoPanel}>
          <h2>Acces projet</h2>
          <p className={styles.muted}>
            Reference : <strong>{search.client_reference}</strong>
            <br />
            Derniere mise a jour : {formatDate(search.updated_at)}
          </p>
          <div className={styles.actions}>
            <Link className={styles.primaryButton} href="/recherche?source=client">
              Modifier ma recherche
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link className={styles.secondaryButton} href="/">
              Retour au site
            </Link>
          </div>
        </aside>
      </section>
    </>
  );
}

function ProjectEmpty({ message }: { message: string }) {
  return (
    <section className={styles.emptyState}>
      <h1>Projet indisponible</h1>
      <p>{message}</p>
      <Link className={styles.primaryButton} href="/client/login">
        Revenir a la connexion
      </Link>
    </section>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Home; label: string; value: string }) {
  return (
    <div className={styles.metricRow}>
      <span className={styles.metricIcon}>
        <Icon size={18} aria-hidden="true" />
      </span>
      <div>
        <small>{label}</small>
        <strong>{value || "Non renseigne"}</strong>
      </div>
    </div>
  );
}

function formatPropertyTypes(types: ClientBuyerSearchRow["property_types"]) {
  return types.length > 0 ? types.map((type) => propertyTypeLabels[type]).join(", ") : "Non renseigne";
}

function formatCurrency(value: number | null) {
  if (!value) {
    return "Non renseigne";
  }

  return new Intl.NumberFormat("fr-FR", {
    currency: "EUR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function formatLocationSummary(data: BuyerSearchFormData) {
  if (data.location.cities.length === 0) {
    return "Non renseigne";
  }

  return data.location.cities.map((city) => `${city.name} (${city.radiusKm ?? 2} km)`).join(", ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
