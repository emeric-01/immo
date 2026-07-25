import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Info,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import type {
  BuyerSearchMarketCombination,
  BuyerSearchMarketFactorTone,
  BuyerSearchMarketScore,
} from "@/lib/buyer-search/market-score-types";
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
  const sectorMatches = getSectorMatches(score);
  const hasTrends = Boolean(
    score.trends &&
      (score.trends.sixMonthsPercent !== null ||
        score.trends.twelveMonthsPercent !== null),
  );

  return (
    <article className={styles.card} data-status={score.status}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Votre recherche</p>
          <h2 className={styles.readingTitle}>{reading.title}</h2>
          <p className={styles.readingText}>{reading.description}</p>
        </div>
        <span className={styles.statusPill}>{reading.badge}</span>
      </header>

      <section className={styles.scoreGauge} aria-label="Position de la recherche sur le marché">
        <div className={styles.gaugeHeading}>
          <span>Votre budget face aux prix du secteur</span>
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
          <dt>Votre budget ramené au m²</dt>
          <dd>{formatCapacityRange(score.target.idealCapacityPerM2, score.target.maximumCapacityPerM2)}</dd>
        </div>
        <div>
          <dt>Prix moyen du secteur</dt>
          <dd>{formatPricePerM2(match.marketPricePerM2)}</dd>
        </div>
        <div>
          <dt>Position du budget</dt>
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
        {match.comparableTransactions} vente{match.comparableTransactions > 1 ? "s" : ""} similaire
        {match.comparableTransactions > 1 ? "s" : ""} prise{match.comparableTransactions > 1 ? "s" : ""} en compte
      </p>

      <section className={styles.factors}>
        <h3>À retenir</h3>
        <ul>
          {score.factors.map((factor) => (
            <li key={factor.label} data-tone={factor.tone}>
              <FactorIcon tone={factor.tone} />
              <span>{factor.label}</span>
            </li>
          ))}
        </ul>
      </section>

      {showBestMatch && sectorMatches.length > 1 ? (
        <SectorComparison matches={sectorMatches} />
      ) : showBestMatch ? (
        <p className={styles.bestMatch}>
          Secteur le plus compatible : <strong>{propertyTypeLabels[match.propertyType]} à {" "}
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

function SectorComparison({ matches }: { matches: BuyerSearchMarketCombination[] }) {
  return (
    <section className={styles.sectorComparison}>
      <header>
        <p className={styles.eyebrow}>Vos secteurs</p>
        <h3>Où votre recherche semble la plus accessible&nbsp;?</h3>
        <span>Nous comparons votre budget aux prix moyens observés dans chaque ville sélectionnée.</span>
      </header>
      <ol>
        {matches.slice(0, 3).map((match, index) => {
          const cityPage = getCityByMarketIdentifier({
            inseeCode: match.cityCode,
            name: match.cityName,
          });
          const reading = getSectorReading(match.gapPercent);

          return (
            <li key={`${match.cityCode ?? match.cityName}-${match.propertyType}`} data-tone={reading.tone}>
              <span className={styles.sectorRank}>{index + 1}</span>
              <div className={styles.sectorCopy}>
                <div>
                  <h4>{match.cityName}</h4>
                  <strong>{reading.label}</strong>
                </div>
                <p>{reading.description}</p>
                <small>
                  {propertyTypeLabels[match.propertyType]} · Prix moyen {formatPricePerM2(match.marketPricePerM2)} · {formatGap(match.gapPercent)}
                </small>
              </div>
              {cityPage ? (
                <Link href={`/prix-m2/${cityPage.slug}`} aria-label={`Voir les prix à ${match.cityName}`}>
                  Voir les prix
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className={styles.sectorDisclaimer}>Ce classement indique une compatibilité avec les prix du marché, pas le nombre de biens actuellement disponibles.</p>
    </section>
  );
}

function getSectorMatches(score: BuyerSearchMarketScore) {
  const matchesByCity = new Map<string, BuyerSearchMarketCombination>();
  const combinations = score.combinations.length > 0 ? score.combinations : [score.bestMatch];

  combinations.forEach((match) => {
    const key = match.cityCode || match.cityName.toLocaleLowerCase("fr-FR");
    const current = matchesByCity.get(key);

    if (!current || match.gapPercent > current.gapPercent) {
      matchesByCity.set(key, match);
    }
  });

  return [...matchesByCity.values()].sort((left, right) => right.gapPercent - left.gapPercent);
}

function getSectorReading(gapPercent: number) {
  if (gapPercent >= 0) {
    return {
      description: "Votre budget laisse une marge par rapport au prix moyen observé.",
      label: "Très compatible",
      tone: "positive",
    } as const;
  }

  if (gapPercent >= -10) {
    return {
      description: "Votre budget est proche des prix moyens du secteur.",
      label: "Recherche réaliste",
      tone: "coherent",
    } as const;
  }

  if (gapPercent >= -20) {
    return {
      description: "Le projet reste possible en ajustant certains critères.",
      label: "Quelques compromis à prévoir",
      tone: "warning",
    } as const;
  }

  return {
    description: "La surface, le quartier ou l’état du bien pourront devoir évoluer.",
    label: "Secteur plus difficile",
    tone: "difficult",
  } as const;
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
        "Votre budget laisse de la marge par rapport aux prix moyens observés. Le quartier et les caractéristiques du bien feront ensuite la différence.",
      title: "Votre budget est bien positionné",
    };
  }

  if (status === "coherent") {
    return {
      badge: "Recherche cohérente",
      description:
        "Votre budget est proche des prix observés dans le secteur choisi.",
      title: "Votre projet semble bien engagé",
    };
  }

  if (status === "tight") {
    return {
      badge: "Compromis à prévoir",
      description:
        "Un peu de souplesse sur la surface, le quartier ou l’état du bien ouvrira davantage de possibilités.",
      title: "Votre recherche reste possible",
    };
  }

  return {
    badge: "Budget à ajuster",
    description:
      "Avec les critères actuels, le budget est inférieur aux prix moyens observés. Quelques ajustements peuvent débloquer la recherche.",
    title: "Quelques ajustements peuvent aider",
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
