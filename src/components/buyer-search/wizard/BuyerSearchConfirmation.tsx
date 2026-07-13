"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Home, MapPin, WalletCards, BedDouble, CalendarDays } from "lucide-react";
import {
  optionLabel,
  propertyTypeLabels,
  purchaseTimelineOptions,
} from "@/lib/buyer-search/options";
import { loadSubmittedBuyerSearch } from "@/lib/buyer-search/storage";
import type { BuyerSearchFormData } from "@/lib/buyer-search/types";
import styles from "./buyer-search-wizard.module.css";

export function BuyerSearchConfirmation() {
  const [data, setData] = useState<BuyerSearchFormData | null>(null);

  useEffect(() => {
    setData(loadSubmittedBuyerSearch());
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
            <ConfirmationItem icon={Home} title="Type de bien" value={data.property.type ? propertyTypeLabels[data.property.type] : "Non renseigne"} />
            <ConfirmationItem icon={MapPin} title="Localisation" value={formatLocationSummary(data.location.cities)} />
            <ConfirmationItem icon={WalletCards} title="Budget maximum" value={formatCurrency(data.property.maximumBudget)} />
            <ConfirmationItem icon={BedDouble} title="Chambres" value={`${data.characteristics.minimumBedrooms ?? 0} chambre(s) minimum`} />
            <ConfirmationItem icon={CalendarDays} title="Delai d'achat" value={optionLabel(purchaseTimelineOptions, data.project.purchaseTimeline)} />
          </div>
        ) : (
          <p className={styles.infoLine}>Aucune recherche enregistree localement sur ce navigateur.</p>
        )}
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
