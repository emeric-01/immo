import { AlertCircle, BarChart3, CheckCircle2, Info } from "lucide-react";
import type { BuyerSearchMarketFactorTone, BuyerSearchMarketScore } from "@/lib/buyer-search/market-score-types";
import { propertyTypeLabels } from "@/lib/buyer-search/options";
import styles from "./market-score-card.module.css";

export function MarketScoreCard({ score }: { score: BuyerSearchMarketScore }) {
  const match = score.bestMatch;

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
