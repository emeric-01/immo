"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Home, MapPin, WalletCards, BedDouble, CalendarDays, KeyRound, Ruler } from "lucide-react";
import {
  normalizePropertyTypes,
  optionLabel,
  propertyTypeLabels,
  purchaseTimelineOptions,
} from "@/lib/buyer-search/options";
import { loadSubmittedBuyerSearchSnapshot, type BuyerSearchSubmittedSnapshot } from "@/lib/buyer-search/storage";
import type { BuyerSearchFormData } from "@/lib/buyer-search/types";
import styles from "./buyer-search-wizard.module.css";

export function BuyerSearchConfirmation() {
  const [snapshot, setSnapshot] = useState<BuyerSearchSubmittedSnapshot | null>(null);
  const data = snapshot?.data ?? null;
  const clientAccess = snapshot?.result?.clientAccess;

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
          <div className={styles.summaryGrid}>
            <ConfirmationItem icon={Home} title="Type de bien" value={formatPropertyTypes(data)} />
            <ConfirmationItem icon={MapPin} title="Localisation" value={formatLocationSummary(data.location.cities)} />
            <ConfirmationItem icon={WalletCards} title="Budget maximum" value={formatCurrency(data.property.maximumBudget)} />
            {data.preferences.minimumLandArea ? (
              <ConfirmationItem icon={Ruler} title="Terrain minimum" value={`${data.preferences.minimumLandArea} m2`} />
            ) : null}
            <ConfirmationItem icon={BedDouble} title="Chambres" value={`${data.characteristics.minimumBedrooms ?? 0} chambre(s) minimum`} />
            <ConfirmationItem icon={CalendarDays} title="Delai d'achat" value={optionLabel(purchaseTimelineOptions, data.project.purchaseTimeline)} />
          </div>
        ) : (
          <p className={styles.infoLine}>Aucune recherche enregistree localement sur ce navigateur.</p>
        )}
        {clientAccess ? (
          <section className={styles.clientAccessCard}>
            <span className={styles.iconBubble}>
              <KeyRound size={24} aria-hidden="true" />
            </span>
            <div>
              <h2>Votre acces client</h2>
              <p>
                Reference : <strong>{clientAccess.reference}</strong>
                <br />
                Code : <strong>{clientAccess.code}</strong>
              </p>
              <small>Conservez ces informations pour retrouver et modifier votre projet depuis l&apos;espace client.</small>
            </div>
            <Link className={styles.primaryButton} href="/client/login">
              Acceder a mon projet
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
  value: string;
}) {
  return (
    <article className={styles.summaryCard}>
      <span className={styles.iconBubble}>
        <Icon size={24} aria-hidden="true" />
      </span>
      <div>
        <h3>{title}</h3>
        <p>{value || "Non renseigne"}</p>
      </div>
    </article>
  );
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

function formatLocationSummary(cities: BuyerSearchFormData["location"]["cities"]) {
  if (cities.length === 0) {
    return "Non renseigne";
  }

  return cities.map((city) => `${city.name} (${city.radiusKm ?? 2} km)`).join(", ");
}

function formatPropertyTypes(data: BuyerSearchFormData) {
  const selectedTypes = normalizePropertyTypes(data.property.types?.length ? data.property.types : data.property.type);

  return selectedTypes.length > 0
    ? selectedTypes.map((type) => propertyTypeLabels[type]).join(", ")
    : "Non renseigne";
}
