import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Info,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { BuyerSearchMarketFactorTone, BuyerSearchMarketScore } from "@/lib/buyer-search/market-score-types";
import { propertyTypeLabels } from "@/lib/buyer-search/options";
import styles from "./market-score-card.module.css";

export function MarketScoreCard({ score }: { score: BuyerSearchMarketScore }) {
  const match = score.bestMatch;
  const markerPosition = Math.min(98, Math.max(2, score.score));
  const hasTrends = Boolean(
    score.trends &&
      (score.trends.sixMonthsPercent !== null ||
        score.trends.twelveMonthsPercent !== null),
  );

  return (
    <article className={styles.card} data-status={score.status}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Coherence avec le marche</p>
          <div className={styles.scoreLine}>
            <strong>{score.score}</strong>
            <span>/100</span>
          </div>
        </div>
        <span className={styles.statusPill}>{score.label}</span>
      </header>

      <section className={styles.scoreGauge} aria-label="Position de la recherche sur le marché">
        <div className={styles.gaugeHeading}>
          <span>Position de votre recherche</span>
          <strong>{formatGap(match.gapPercent)}</strong>
        </div>
        <div
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={score.score}
          className={styles.gaugeTrack}
          role="meter"
        >
          <span
            className={styles.gaugeMarker}
            data-negative={match.gapPercent < 0 || undefined}
            style={{ left: `${markerPosition}%` }}
          />
        </div>
        <div className={styles.gaugeLabels} aria-hidden="true">
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>
      </section>

      <dl className={styles.marketMetrics}>
        <div>
          <dt>Votre capacite</dt>
          <dd>
            {formatPricePerM2(score.target.idealCapacityPerM2)} a {formatPricePerM2(score.target.maximumCapacityPerM2)}
          </dd>
        </div>
        <div>
          <dt>Prix observe</dt>
          <dd>{formatPricePerM2(match.marketPricePerM2)}</dd>
        </div>
        <div>
          <dt>Ecart</dt>
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
        {match.comparableTransactions > 1 ? "s" : ""} observee{match.comparableTransactions > 1 ? "s" : ""}
      </p>

      <section className={styles.factors}>
        <h3>Ce qui influence le score</h3>
        <ul>
          {score.factors.map((factor) => (
            <li key={factor.label} data-tone={factor.tone}>
              <FactorIcon tone={factor.tone} />
              <span>{factor.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className={styles.bestMatch}>
        Meilleure coherence : <strong>{propertyTypeLabels[match.propertyType]} a {match.cityName}</strong>
      </p>
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
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value)} EUR/m2`;
}

function formatGap(value: number) {
  const rounded = Math.abs(Number(value.toFixed(1)));

  if (value < 0) {
    return `${rounded} % sous le prix moyen`;
  }

  if (value > 0) {
    return `${rounded} % au-dessus du prix moyen`;
  }

  return "Aligne avec le prix moyen";
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
