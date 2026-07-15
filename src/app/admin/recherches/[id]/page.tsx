import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BedDouble, CalendarDays, Euro, Home, Mail, MapPin, Phone, ShieldCheck, Star, Trash2, UserRound } from "lucide-react";
import { MarketScoreCard } from "@/components/buyer-search/MarketScoreCard";
import {
  formatAdminPreferences,
  formatAdminPropertyTypes,
  formatPreferredChannel,
  getAdminBuyerSearch,
} from "@/lib/admin/buyer-searches";
import { optionLabel, financingOptions, purchaseTimelineOptions, situationOptions } from "@/lib/buyer-search/options";
import { requireAdminSession } from "@/lib/admin/auth";
import styles from "../../admin.module.css";

export const metadata: Metadata = {
  title: "Detail recherche | Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminBuyerSearchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminSession();
  const { id } = await params;
  const result = await getAdminBuyerSearch(id);

  if (result.status !== "ready") {
    return (
      <DetailFrame>
        <section className={styles.emptyState}>
          <ShieldCheck size={26} aria-hidden="true" />
          <h1>Lecture BDD a finaliser</h1>
          <p>{result.message}</p>
        </section>
      </DetailFrame>
    );
  }

  if (!result.data) {
    return (
      <DetailFrame>
        <section className={styles.emptyState}>
          <h1>Recherche introuvable</h1>
          <p>Ce formulaire n&apos;existe pas ou n&apos;est plus disponible.</p>
        </section>
      </DetailFrame>
    );
  }

  const { consents, locations, priorities, search } = result.data;
  const preferences = formatAdminPreferences(search);

  return (
    <DetailFrame>
      <section className={styles.detailHero}>
        <Link className={styles.backLink} href="/admin/recherches">
          <ArrowLeft size={18} aria-hidden="true" />
          Retour aux recherches
        </Link>
        <div className={styles.detailHeroGrid}>
          <div>
            <p className={styles.eyebrow}>Formulaire acheteur</p>
            <h1>
              {search.contact_first_name} {search.contact_last_name}
            </h1>
            <p>{search.location_summary || "Localisation non renseignee"}</p>
          </div>
          <div className={styles.contactBox}>
            <a href={`mailto:${search.contact_email}`}>
              <Mail size={18} aria-hidden="true" />
              {search.contact_email}
            </a>
            <a href={`tel:${search.contact_phone.replace(/\s/g, "")}`}>
              <Phone size={18} aria-hidden="true" />
              {search.contact_phone}
            </a>
          </div>
        </div>
      </section>

      {search.status === "deleted_by_client" ? (
        <section className={styles.deletedNotice}>
          <Trash2 size={20} aria-hidden="true" />
          <div>
            <strong>Recherche supprimee par l&apos;utilisateur</strong>
            <p>Elle reste conservee dans l&apos;historique administratif{search.deleted_at ? ` depuis le ${formatDate(search.deleted_at)}` : ""}.</p>
          </div>
        </section>
      ) : null}

      <section className={styles.detailGrid}>
        {search.market_score_payload ? <MarketScoreCard score={search.market_score_payload} /> : null}

        <InfoPanel title="Synthese">
          <Metric icon={Home} label="Type de bien" value={formatAdminPropertyTypes(search.property_types)} />
          <Metric icon={Euro} label="Budget maximum" value={formatCurrency(search.maximum_budget)} />
          <Metric icon={BedDouble} label="Surface et pieces" value={formatSpace(search)} />
          <Metric icon={CalendarDays} label="Projet" value={formatProject(search)} />
        </InfoPanel>

        <InfoPanel title="Localisation">
          {locations.length > 0 ? (
            <div className={styles.locationList}>
              {locations.map((location) => (
                <div key={location.id}>
                  <MapPin size={18} aria-hidden="true" />
                  <div>
                    <strong>{location.name}</strong>
                    <span>
                      {location.postal_code || location.postal_codes.join(", ") || "CP non renseigne"} - {location.radius_km ?? 0} km
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.mutedText}>Aucune ville detaillee.</p>
          )}
        </InfoPanel>

        <InfoPanel title="Preferences">
          {preferences.length > 0 ? (
            <div className={styles.tagGrid}>
              {preferences.map((preference) => (
                <span key={preference}>{preference}</span>
              ))}
            </div>
          ) : (
            <p className={styles.mutedText}>Aucune preference selectionnee.</p>
          )}
        </InfoPanel>

        <InfoPanel title="Priorites">
          {priorities.length > 0 ? (
            <div className={styles.priorityList}>
              {priorities.map((priority) => (
                <div key={priority.id}>
                  <Star size={18} aria-hidden="true" />
                  <div>
                    <strong>{priority.label}</strong>
                    <span>
                      {priority.value} - {priority.level === "essential" ? "Indispensable" : "Souhaite"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.mutedText}>Priorites non definies.</p>
          )}
        </InfoPanel>

        <InfoPanel title="Contact et consentement" wide>
          <div className={styles.contactSummary}>
            <Metric icon={UserRound} label="Canal privilegie" value={formatPreferredChannel(search.preferred_channel)} />
            <Metric icon={ShieldCheck} label="Consentement" value={search.consent ? "Accepte" : "Non accepte"} />
            <Metric icon={CalendarDays} label="Date de depot" value={formatDate(search.created_at)} />
          </div>
          {consents[0] ? <p className={styles.consentText}>{consents[0].consent_text}</p> : null}
        </InfoPanel>
      </section>
    </DetailFrame>
  );
}

function DetailFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className={styles.detailPage}>
      <div className={styles.detailShell}>{children}</div>
    </main>
  );
}

function InfoPanel({ children, title, wide }: { children: React.ReactNode; title: string; wide?: boolean }) {
  return (
    <article className={styles.infoPanel} data-wide={wide || undefined}>
      <h2>{title}</h2>
      {children}
    </article>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Home; label: string; value: string }) {
  return (
    <div className={styles.metricRow}>
      <span>
        <Icon size={18} aria-hidden="true" />
      </span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function formatCurrency(value?: number | null) {
  if (!value) {
    return "Non renseigne";
  }

  return new Intl.NumberFormat("fr-FR", {
    currency: "EUR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatSpace(search: {
  minimum_bathrooms: number | null;
  minimum_bedrooms: number | null;
  minimum_land_area: number | null;
  minimum_living_area: number | null;
  minimum_rooms: number | null;
}) {
  return [
    `${search.minimum_living_area ?? 0} m2 hab.`,
    search.minimum_land_area ? `${search.minimum_land_area} m2 terrain` : null,
    `${search.minimum_rooms ?? 0} pieces`,
    `${search.minimum_bedrooms ?? 0} chambres`,
    `${search.minimum_bathrooms ?? 0} sde`,
  ]
    .filter(Boolean)
    .join(" - ");
}

function formatProject(search: { current_situation: string | null; financing_status: string | null; purchase_timeline: string | null }) {
  return [
    optionLabel(purchaseTimelineOptions, search.purchase_timeline),
    optionLabel(financingOptions, search.financing_status),
    optionLabel(situationOptions, search.current_situation),
  ]
    .filter(Boolean)
    .join(" - ");
}
