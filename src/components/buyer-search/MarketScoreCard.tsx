import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Info,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import type { BuyerSearchMarketFactorTone, BuyerSearchMarketScore } from "@/lib/buyer-search/market-score-types";
import { propertyTypeLabels } from "@/lib/buyer-search/options";
import { getCityByMarketIdentifier } from "@/lib/cities";
import styles from "./market-score-card.module.css";

export function MarketScoreCard({
  score,
  showBestMatch = true,
}: {
  score: BuyerSearchMarketScore;
  showBestMatch?: boolean;
}) {
  const match = score.bestMatch;
  const cityPage = getCityByMarketIdentifier({
    inseeCode: match.cityCode,
    name: match.cityName,
  });
  const markerPosition = Math.min(98, Math.max(2, score.score));
  const reading = getMarketReading(score.status);
  const hasTrends = Boolean(
    score.trends &&
      (score.trends.sixMonthsPercent !== null ||
        score.trends.twelveMonthsPercent !== null),
  );

  return (
    <article className={styles.card} data-status={score.status}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Lecture de votre recherche</p>
          <h2 className={styles.readingTitle}>{reading.title}</h2>
          <p className={styles.readingText}>{reading.description}</p>
        </div>
        <span className={styles.statusPill}>{reading.badge}</span>
      </header>

      <section className={styles.scoreGauge} aria-label="Position de la recherche sur le marché">
        <div className={styles.gaugeHeading}>
          <span>Position par rapport au marché</span>
          <strong>{formatGap(match.gapPercent)}</strong>
        </div>
        <div
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={score.score}
          aria-valuetext={reading.badge}
          className={styles.gaugeTrack}
          role="meter"
        >
          <span
            className={styles.gaugeMarker}
            data-status={score.status}
            style={{ left: `${markerPosition}%` }}
          />
        </div>
        <div className={styles.gaugeLabels}>
          <span>À ajuster</span>
          <span>Cohérente</span>
          <span>Budget confortable</span>
        </div>
      </section>

      <dl className={styles.marketMetrics}>
        <div>
          <dt>Votre capacité estimée</dt>
          <dd>{formatCapacityRange(score.target.idealCapacityPerM2, score.target.maximumCapacityPerM2)}</dd>
        </div>
        <div>
          <dt>Prix moyen observé</dt>
          <dd>{formatPricePerM2(match.marketPricePerM2)}</dd>
        </div>
        <div>
          <dt>Écart</dt>
          <dd data-tone={match.gapPercent >= -10 ? "positive" : "warning"}>{formatGap(match.gapPercent)}</dd>
        </div>
      </dl>

      {hasTrends && score.trends ? (
        <section className={styles.trends}>
          <div className={styles.trendsHeading}>
            <div>
              <p>Tendance des prix</p>
              <span>Évolution du prix au m² sur le secteur retenu</span>
            </div>
            {score.trends.latestPeriod ? (
              <small>Données jusqu&apos;à {formatPeriod(score.trends.latestPeriod)}</small>
            ) : null}
          </div>
          <div className={styles.trendGrid}>
            <TrendMetric label="6 mois" value={score.trends.sixMonthsPercent} />
            <TrendMetric label="12 mois" value={score.trends.twelveMonthsPercent} />
          </div>
        </section>
      ) : null}

      <p className={styles.comparables}>
        <BarChart3 size={18} aria-hidden="true" />
        {match.comparableTransactions} vente{match.comparableTransactions > 1 ? "s" : ""} comparable
        {match.comparableTransactions > 1 ? "s" : ""} observée{match.comparableTransactions > 1 ? "s" : ""}
      </p>

      <section className={styles.factors}>
        <h3>Comment lire ce résultat&nbsp;?</h3>
        <ul>
          {score.factors.map((factor) => (
            <li key={factor.label} data-tone={factor.tone}>
              <FactorIcon tone={factor.tone} />
              <span>{factor.label}</span>
            </li>
          ))}
        </ul>
      </section>

      {showBestMatch ? (
        <p className={styles.bestMatch}>
          Meilleure correspondance : <strong>{propertyTypeLabels[match.propertyType]} à {" "}
          {cityPage ? (
            <Link href={`/prix-m2/${cityPage.slug}`}>{match.cityName}</Link>
          ) : (
            match.cityName
          )}</strong>
        </p>
      ) : null}
    </article>
  );
}

function TrendMetric({ label, value }: { label: string; value: number | null }) {
  const tone = value === null ? "stable" : value > 0.5 ? "up" : value < -0.5 ? "down" : "stable";
  const Icon = tone === "up" ? TrendingUp : tone === "down" ? TrendingDown : Minus;

  return (
    <div className={styles.trendMetric} data-tone={tone}>
      <span>
        <Icon size={19} aria-hidden="true" />
      </span>
      <div>
        <small>{label}</small>
        <strong>{formatTrend(value)}</strong>
      </div>
    </div>
  );
}

function FactorIcon({ tone }: { tone: BuyerSearchMarketFactorTone }) {
  if (tone === "positive") {
    return <CheckCircle2 size={19} aria-hidden="true" />;
  }

  if (tone === "warning") {
    return <AlertCircle size={19} aria-hidden="true" />;
  }

  return <Info size={19} aria-hidden="true" />;
}

function formatPricePerM2(value: number) {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value)} €/m²`;
}

function formatCapacityRange(ideal: number, maximum: number) {
  if (ideal === maximum) {
    return formatPricePerM2(ideal);
  }

  return `${formatPricePerM2(ideal)} à ${formatPricePerM2(maximum)}`;
}

function formatGap(value: number) {
  const rounded = Math.abs(Number(value.toFixed(1)));

  if (value < 0) {
    return `${rounded} % sous le prix moyen`;
  }

  if (value > 0) {
    return `${rounded} % au-dessus du prix moyen`;
  }

  return "Aligné avec le prix moyen";
}

function getMarketReading(status: BuyerSearchMarketScore["status"]) {
  if (status === "excellent") {
    return {
      badge: "Budget confortable",
      description:
        "Votre budget offre une marge par rapport aux prix moyens observés, à confirmer selon le quartier et les caractéristiques du bien.",
      title: "Votre recherche paraît réaliste",
    };
  }

  if (status === "coherent") {
    return {
      badge: "Recherche cohérente",
      description:
        "Votre budget est globalement aligné avec les prix observés sur le secteur retenu.",
      title: "Votre recherche paraît réaliste",
    };
  }

  if (status === "tight") {
    return {
      badge: "Compromis à prévoir",
      description:
        "La surface, le secteur ou l’état du bien pourront devoir être ajustés pour élargir les possibilités.",
      title: "Votre recherche reste possible",
    };
  }

  return {
    badge: "Budget à ajuster",
    description:
      "Votre budget se situe sous les prix moyens observés pour les critères actuellement retenus.",
    title: "Votre recherche mérite d’être ajustée",
  };
}

function formatTrend(value: number | null) {
  if (value === null) {
    return "Non disponible";
  }

  const prefix = value > 0 ? "+" : "";
  return `${prefix}${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(value)} %`;
}

function formatPeriod(period: string) {
  const [year, month] = period.split("-").map(Number);

  if (!year || !month) {
    return period;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}
