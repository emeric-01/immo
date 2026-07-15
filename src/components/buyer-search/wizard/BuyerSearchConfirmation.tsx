"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Check, Home, MapPin, WalletCards, BedDouble, CalendarDays, UserRound, Ruler, Info } from "lucide-react";
import { MarketScoreCard } from "@/components/buyer-search/MarketScoreCard";
import {
  normalizePropertyTypes,
  optionLabel,
  propertyTypeLabels,
  purchaseTimelineOptions,
} from "@/lib/buyer-search/options";
import { loadSubmittedBuyerSearchSnapshot, type BuyerSearchSubmittedSnapshot } from "@/lib/buyer-search/storage";
import type { BuyerSearchFormData } from "@/lib/buyer-search/types";
import { getCityByMarketIdentifier } from "@/lib/cities";
import styles from "./buyer-search-wizard.module.css";

export function BuyerSearchConfirmation() {
  const [snapshot, setSnapshot] = useState<BuyerSearchSubmittedSnapshot | null>(null);
  const data = snapshot?.data ?? null;
  const marketScore = snapshot?.result?.marketScore ?? null;
  const clientLoginHref = data
    ? `/client/login?email=${encodeURIComponent(data.contact.email.trim().toLowerCase())}`
    : "/client/login";

  useEffect(() => {
    setSnapshot(loadSubmittedBuyerSearchSnapshot());
  }, []);

  return (
    <main className={styles.page}>
      <section className={`${styles.shell} ${styles.confirmationShell}`}>
        <div className={styles.confirmationHero}>
          <span className={styles.confirmationIcon}>
            <Check size={34} aria-hidden="true" />
          </span>
          <h1>Votre recherche est bien enregistree</h1>
          <p>Nous vous contacterons lorsqu&apos;un bien correspondant a vos criteres sera identifie.</p>
        </div>
        {data ? (
          <div className={`${styles.confirmationContent} ${marketScore ? "" : styles.confirmationContentSingle}`}>
            <section className={styles.confirmationSearchColumn}>
              <header className={styles.confirmationColumnHeader}>
                <p>Votre recherche</p>
                <h2>Les criteres enregistres</h2>
              </header>
              <div className={styles.confirmationSummaryGrid}>
                <ConfirmationItem icon={Home} title="Type de bien" value={formatPropertyTypes(data)} />
                <ConfirmationItem icon={MapPin} title="Localisation" value={<ConfirmationLocations cities={data.location.cities} />} />
                <ConfirmationItem icon={WalletCards} title="Budget maximum" value={formatCurrency(data.property.maximumBudget)} />
                {data.preferences.minimumLandArea ? (
                  <ConfirmationItem icon={Ruler} title="Terrain minimum" value={`${data.preferences.minimumLandArea} m2`} />
                ) : null}
                <ConfirmationItem icon={BedDouble} title="Chambres" value={`${data.characteristics.minimumBedrooms ?? 0} chambre(s) minimum`} />
                <ConfirmationItem icon={CalendarDays} title="Delai d'achat" value={optionLabel(purchaseTimelineOptions, data.project.purchaseTimeline)} />
              </div>
            </section>
            {marketScore ? (
              <section className={styles.confirmationScoreColumn}>
                <header className={styles.confirmationScoreIntro}>
                  <Info size={20} aria-hidden="true" />
                  <div>
                    <h2>Pertinence de votre projet</h2>
                    <p>Ce score permet de verifier la coherence de votre recherche face aux prix observes sur le marche immobilier local.</p>
                  </div>
                </header>
                <MarketScoreCard
                  score={marketScore}
                  showBestMatch={data.location.cities.length > 1}
                />
              </section>
            ) : null}
          </div>
        ) : (
          <p className={styles.infoLine}>Aucune recherche enregistree localement sur ce navigateur.</p>
        )}
        {snapshot?.result?.persisted && data ? (
          <section className={styles.clientAccessCard}>
            <span className={styles.iconBubble}>
              <UserRound size={24} aria-hidden="true" />
            </span>
            <div>
              <h2>Votre espace client</h2>
              <p>Cette recherche est rattachée à {data.contact.email}. Connectez-vous par email pour la retrouver avec vos autres projets.</p>
            </div>
            <Link className={styles.primaryButton} href={clientLoginHref}>
              Accéder à mon espace
            </Link>
          </section>
        ) : null}
        <div className={styles.navigation}>
          <Link className={styles.backButton} href="/recherche">
            <ArrowLeft size={18} aria-hidden="true" />
            Modifier ma recherche
          </Link>
          <Link className={styles.primaryButton} href="/">
            Retour au site
          </Link>
        </div>
      </section>
    </main>
  );
}

function ConfirmationItem({
  icon: Icon,
  title,
  value,
}: {
  icon: typeof Home;
  title: string;
  value: ReactNode;
}) {
  return (
    <article className={styles.summaryCard}>
      <span className={styles.iconBubble}>
        <Icon size={24} aria-hidden="true" />
      </span>
      <div>
        <h3>{title}</h3>
        <p>{typeof value === "string" ? value || "Non renseigne" : value}</p>
      </div>
    </article>
  );
}

function ConfirmationLocations({ cities }: { cities: BuyerSearchFormData["location"]["cities"] }) {
  if (cities.length === 0) {
    return "Non renseigne";
  }

  return cities.map((city, index) => {
    const cityPage = getCityByMarketIdentifier({ inseeCode: city.cityCode, name: city.name });
    const label = `${city.name} (${city.radiusKm ?? 2} km)`;

    return (
      <span key={`${city.cityCode ?? city.name}-${index}`}>
        {index > 0 ? ", " : null}
        {cityPage ? <Link href={`/prix-immobilier/${cityPage.slug}`}>{label}</Link> : label}
      </span>
    );
  });
}

function formatCurrency(value: number | null) {
  if (!value) {
    return "Non renseigne";
  }

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPropertyTypes(data: BuyerSearchFormData) {
  const selectedTypes = normalizePropertyTypes(data.property.types?.length ? data.property.types : data.property.type);

  return selectedTypes.length > 0
    ? selectedTypes.map((type) => propertyTypeLabels[type]).join(", ")
    : "Non renseigne";
}
