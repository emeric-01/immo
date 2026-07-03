import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCityBySlug,
  getNearbyCities,
  southCities,
} from "@/lib/cities";
import {
  getCityMarketData,
  getStaticCityMarketData,
  type CityPriceHistoryPoint,
  type PropertyMarketStat,
} from "@/lib/city-market-data";
import { CityPriceMap } from "./city-price-map";

type CityPricePageProps = {
  params: Promise<{
    city: string;
  }>;
};

const euroFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 1,
});

function formatPrice(value: number) {
  return `${euroFormatter.format(value)} €`;
}

function formatPercent(value: number) {
  const sign = value > 0 ? "+" : "";

  return `${sign}${decimalFormatter.format(value)} %`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

function getAverageMarketPrice(apartment: number, house: number) {
  return Math.round((apartment + house) / 2);
}

function getMarketCacheDays() {
  const days = Number(process.env.CITY_MARKET_REVALIDATE_DAYS ?? "30");

  return Number.isFinite(days) && days > 0 ? Math.round(days) : 30;
}

function ConfidenceDots({ score }: { score: number }) {
  return (
    <span className="confidence-dots" aria-label={`Indice de confiance ${score} sur 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span className={index < score ? "active" : ""} key={index} />
      ))}
    </span>
  );
}

function MarketTypeCard({
  title,
  stat,
  icon,
}: {
  title: string;
  stat: PropertyMarketStat;
  icon: "apartment" | "house";
}) {
  return (
    <article className="city-price-type-card">
      <span className={`city-property-symbol ${icon}`} aria-hidden="true" />
      <div>
        <span className="city-price-label">Prix m2 moyen</span>
        <strong>{formatPrice(stat.averagePricePerM2)}</strong>
        <small>
          de {formatPrice(stat.lowPricePerM2)} a {formatPrice(stat.highPricePerM2)}
        </small>
        <span className="city-confidence-row">
          Indice de confiance <ConfidenceDots score={stat.confidenceScore} />
        </span>
      </div>
      <span className="city-property-type">{title}</span>
    </article>
  );
}

function PriceDistribution({ stat }: { stat: PropertyMarketStat }) {
  return (
    <div className="price-distribution" aria-label="Fourchette de prix">
      <span />
      <span />
      <span />
      <div>
        <strong>{formatPrice(stat.lowPricePerM2)}</strong>
        <small>Fourchette basse</small>
      </div>
      <div>
        <strong>{formatPrice(stat.averagePricePerM2)}</strong>
        <small>Prix moyen</small>
      </div>
      <div>
        <strong>{formatPrice(stat.highPricePerM2)}</strong>
        <small>Fourchette haute</small>
      </div>
    </div>
  );
}

function TrendChart({ points }: { points: CityPriceHistoryPoint[] }) {
  const width = 900;
  const height = 280;
  const padding = 28;
  const values = points.flatMap((point) => [point.apartment, point.house]);
  const min = Math.min(...values) * 0.96;
  const max = Math.max(...values) * 1.04;
  const range = Math.max(1, max - min);

  function getPath(key: "apartment" | "house") {
    return points
      .map((point, index) => {
        const x =
          padding + (index / Math.max(1, points.length - 1)) * (width - padding * 2);
        const y =
          height - padding - ((point[key] - min) / range) * (height - padding * 2);

        return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }

  return (
    <svg
      className="city-trend-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Evolution du prix immobilier"
    >
      {[0, 1, 2, 3].map((line) => {
        const y = padding + line * ((height - padding * 2) / 3);

        return <path d={`M ${padding} ${y} H ${width - padding}`} key={line} />;
      })}
      <path className="apartment-line" d={getPath("apartment")} />
      <path className="house-line" d={getPath("house")} />
      {points.map((point, index) => {
        if (index % 2 !== 0 && index !== points.length - 1) {
          return null;
        }

        const x =
          padding + (index / Math.max(1, points.length - 1)) * (width - padding * 2);

        return (
          <text x={x} y={height - 4} key={point.period}>
            {point.period}
          </text>
        );
      })}
    </svg>
  );
}

export function generateStaticParams() {
  return southCities.map((city) => ({
    city: city.slug,
  }));
}

export async function generateMetadata({
  params,
}: CityPricePageProps): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);

  if (!city) {
    return {};
  }

  return {
    title: `Prix immobilier a ${city.name} (${city.postalCode}) - Prix m2 appartement et maison`,
    description: `Prix immobilier a ${city.name} : prix moyen au m2, fourchettes appartement et maison, evolution du marche, quartiers et villes voisines.`,
  };
}

export default async function CityPricePage({ params }: CityPricePageProps) {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);

  if (!city) {
    notFound();
  }

  const market = await getCityMarketData(city);
  const nearbyCities = getNearbyCities(city);
  const averagePrice = getAverageMarketPrice(
    market.apartment.averagePricePerM2,
    market.house.averagePricePerM2,
  );
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";
  const cacheDays = getMarketCacheDays();
  const sourceText =
    market.source === "immo-data"
      ? "Donnees Immo Data actualisees cote serveur et mises en cache."
      : "Mode pilote : donnees de secours affichees en attendant la reponse Immo Data.";
  const sourceNote =
    market.source === "immo-data"
      ? "Source : Immo Data pour les prix, historiques et transactions disponibles. Les informations locales et les elements absents de l'API restent completes par donnees pilote."
      : "Source : donnees pilote affichees car Immo Data n'est pas encore configure ou n'a pas repondu pour cette generation.";

  return (
    <main className="city-price-page">
      <header className="city-price-header">
        <Link className="city-brand" href="/">
          <span className="brand-shield" aria-hidden="true" />
          <strong>
            Immo<span>Safe</span>
          </strong>
        </Link>
        <nav aria-label="Navigation principale">
          <Link href="/">Estimer un bien</Link>
          <Link href={`/prix-immobilier/${city.slug}`}>Prix immobilier</Link>
        </nav>
      </header>

      <form className="city-search-bar" action={`/prix-immobilier/${city.slug}`}>
        <input
          aria-label="Rechercher une adresse ou une ville"
          placeholder='Ex : "10 rue du Chateau", "Marseille", "13400"...'
        />
        <button>Rechercher</button>
      </form>

      <section className="city-price-hero" aria-labelledby="city-price-title">
        <div className="city-price-panel">
          <nav className="city-breadcrumb" aria-label="Fil d'Ariane">
            <Link href="/">Accueil</Link>
            <span>Prix immobilier</span>
            <span>{city.region}</span>
            <span>{city.department}</span>
            <span>{city.name}</span>
          </nav>

          <div className="city-price-tabs" role="tablist" aria-label="Type de prix">
            <button className="active" type="button">
              Prix au m2
            </button>
            <button type="button">Loyer au m2</button>
          </div>

          <h1 id="city-price-title">
            Prix immobilier a {city.name} ({city.postalCode})
          </h1>
          <p>
            Estimations ImmoSafe au {formatDate(market.updatedAt)}. {sourceText}
          </p>

          <div className="city-price-types">
            <MarketTypeCard title="Appartement" stat={market.apartment} icon="apartment" />
            <MarketTypeCard title="Maison" stat={market.house} icon="house" />
          </div>

          <div className="city-cta-stack">
            <span>Estimez votre bien en fonction de ses caracteristiques</span>
            <Link className="city-primary-cta" href="/">
              Estimer un bien en ligne
            </Link>
            <span>Ou obtenez les prix de vente des biens a proximite</span>
            <Link className="city-secondary-cta" href="#ventes">
              Obtenir les prix de vente
            </Link>
          </div>
        </div>

        <CityPriceMap
          accessToken={mapboxToken}
          cityName={city.name}
          center={{
            longitude: city.longitude,
            latitude: city.latitude,
          }}
          zones={market.zones}
          salePoints={market.salePoints}
        />
      </section>

      <section className="city-content-section city-split-section">
        <article className="city-detail-card">
          <h2>Prix des appartements a {city.name}</h2>
          <p>
            Le prix m2 moyen des appartements a {city.name} est de{" "}
            <strong>{formatPrice(market.apartment.averagePricePerM2)} / m2</strong>.
            La majorite des appartements se situe entre{" "}
            {formatPrice(market.apartment.lowPricePerM2)} et{" "}
            {formatPrice(market.apartment.highPricePerM2)} / m2 selon
            l&apos;adresse, l&apos;etage, l&apos;etat du bien et les prestations.
          </p>
          <PriceDistribution stat={market.apartment} />
        </article>

        <article className="city-detail-card">
          <h2>Prix des maisons a {city.name}</h2>
          <p>
            Le prix m2 moyen des maisons a {city.name} est estime a{" "}
            <strong>{formatPrice(market.house.averagePricePerM2)} / m2</strong>.
            La fourchette varie de {formatPrice(market.house.lowPricePerM2)} a{" "}
            {formatPrice(market.house.highPricePerM2)} / m2 selon la parcelle,
            l&apos;exposition, le quartier et le niveau de renovation.
          </p>
          <PriceDistribution stat={market.house} />
        </article>
      </section>

      <section className="city-content-section city-chart-card" aria-labelledby="city-trend-title">
        <div className="section-title-row">
          <h2 id="city-trend-title">
            Evolution du prix de l&apos;immobilier a {city.name}
          </h2>
          <div className="chart-legend">
            <span className="apartment">Appartement</span>
            <span className="house">Maison</span>
          </div>
        </div>

        <div className="city-trend-kpis">
          <article>
            <span>Appartement - 1 an</span>
            <strong className={market.apartment.trend1Year >= 0 ? "positive" : "negative"}>
              {formatPercent(market.apartment.trend1Year)}
            </strong>
          </article>
          <article>
            <span>Maison - 1 an</span>
            <strong className={market.house.trend1Year >= 0 ? "positive" : "negative"}>
              {formatPercent(market.house.trend1Year)}
            </strong>
          </article>
          <article>
            <span>Prix moyen actuel</span>
            <strong>{formatPrice(averagePrice)} / m2</strong>
          </article>
        </div>

        <TrendChart points={market.history} />
        <p className="city-source-note">
          {sourceNote}
        </p>
      </section>

      <section className="city-content-section city-table-grid">
        <article className="city-table-card">
          <h2>Prix immobilier a {city.name} par quartier</h2>
          <table>
            <thead>
              <tr>
                <th>Quartier</th>
                <th>Prix m2 moyen</th>
              </tr>
            </thead>
            <tbody>
              {market.neighborhoods.map((neighborhood) => (
                <tr key={neighborhood.name}>
                  <td>{neighborhood.name}</td>
                  <td>{formatPrice(neighborhood.pricePerM2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="city-table-card">
          <h2>TOP 5 des rues a {city.name}</h2>
          <div className="street-lists">
            <div>
              <h3>Les plus cheres</h3>
              {market.expensiveStreets.map((street) => (
                <p key={street.name}>
                  <span>{street.name}</span>
                  <strong>{formatPrice(street.pricePerM2)}</strong>
                </p>
              ))}
            </div>
            <div>
              <h3>Les moins cheres</h3>
              {market.affordableStreets.map((street) => (
                <p key={street.name}>
                  <span>{street.name}</span>
                  <strong>{formatPrice(street.pricePerM2)}</strong>
                </p>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section
        className="city-content-section city-sales-section"
        id="ventes"
        aria-labelledby="recent-sales-title"
      >
        <h2 id="recent-sales-title">Dernieres ventes realisees a {city.name}</h2>
        <div className="recent-sales-grid">
          {market.salePoints.slice(0, 5).map((sale) => (
            <article key={sale.id}>
              <span>Vendu</span>
              <h3>{sale.label}</h3>
              <p>
                {sale.propertyType} {sale.rooms} pieces - {sale.surfaceM2} m2
              </p>
              <small>Vendu en {sale.soldAt}</small>
              <Link href="/">Obtenir le prix</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="city-content-section city-seo-text">
        <h2>Quels sont les prix de l&apos;immobilier en detail a {city.name} ?</h2>
        <p>
          L&apos;estimation ImmoSafe du prix immobilier a {city.name} au{" "}
          {formatDate(market.updatedAt)} est de {formatPrice(averagePrice)} / m2
          en moyenne, tous types de biens confondus. Pour connaitre le prix
          d&apos;un bien precis, le plus fiable reste de lancer une estimation
          immobiliere en ligne avec l&apos;adresse et les caracteristiques du logement.
        </p>
        <h3>Prix m2 appartement</h3>
        <p>
          Le prix m2 moyen des appartements a {city.name} est de{" "}
          {formatPrice(market.apartment.averagePricePerM2)}. Il varie fortement
          selon l&apos;adresse, la copropriete, l&apos;etage, l&apos;exterieur et l&apos;etat du bien.
        </p>
        <h3>Prix m2 maison</h3>
        <p>
          Le prix m2 des maisons a {city.name} est estime a{" "}
          {formatPrice(market.house.averagePricePerM2)} en moyenne. Les maisons
          avec terrain, vue, stationnement ou renovation recente peuvent sortir
          de la fourchette moyenne.
        </p>
      </section>

      <section className="city-content-section city-local-grid">
        <article>
          <h2>{city.name} ({city.postalCode}) : informations locales</h2>
          <dl>
            <div>
              <dt>Population</dt>
              <dd>{euroFormatter.format(market.localInfo.population)} habitants</dd>
            </div>
            {typeof market.localInfo.medianAge === "number" ? (
              <div>
                <dt>Age median</dt>
                <dd>{market.localInfo.medianAge} ans</dd>
              </div>
            ) : null}
            <div>
              <dt>Densite</dt>
              <dd>{euroFormatter.format(market.localInfo.density)} hab. / km2</dd>
            </div>
            <div>
              <dt>Surface</dt>
              <dd>{decimalFormatter.format(market.localInfo.areaKm2)} km2</dd>
            </div>
            {typeof market.localInfo.homes === "number" ? (
              <div>
                <dt>Logements</dt>
                <dd>{euroFormatter.format(market.localInfo.homes)} logements</dd>
              </div>
            ) : null}
            {typeof market.localInfo.ownerShare === "number" ? (
              <div>
                <dt>Proprietaires</dt>
                <dd>{decimalFormatter.format(market.localInfo.ownerShare)} %</dd>
              </div>
            ) : null}
          </dl>
        </article>

        <article>
          <h2>Prix immobilier au m2 des villes voisines</h2>
          <div className="nearby-city-list">
            {nearbyCities.map((nearbyCity) => {
              const nearbyMarket = getStaticCityMarketData(nearbyCity);
              const nearbyAverage = getAverageMarketPrice(
                nearbyMarket.apartment.averagePricePerM2,
                nearbyMarket.house.averagePricePerM2,
              );

              return (
                <Link href={`/prix-immobilier/${nearbyCity.slug}`} key={nearbyCity.slug}>
                  <span>{nearbyCity.name}</span>
                  <strong>{formatPrice(nearbyAverage)} / m2</strong>
                </Link>
              );
            })}
          </div>
        </article>
      </section>

      <section className="city-content-section city-faq-section">
        <h2>FAQ prix immobilier {city.name}</h2>
        <details>
          <summary>Quel est le prix moyen au m2 a {city.name} ?</summary>
          <p>
            Le prix moyen au m2 a {city.name} est estime a{" "}
            {formatPrice(averagePrice)} / m2, avec des ecarts entre les
            appartements, les maisons et les quartiers.
          </p>
        </details>
        <details>
          <summary>Comment estimer un bien a {city.name} ?</summary>
          <p>
            Renseignez l&apos;adresse, le type de bien, la surface, le nombre de
            pieces et les caracteristiques principales. L&apos;estimation sera plus
            precise avec un DPE, un etage, un exterieur ou un parking.
          </p>
        </details>
        <details>
          <summary>Les donnees sont-elles actualisees ?</summary>
          <p>
            Oui. Pour {city.name}, les appels Immo Data sont faits cote serveur et
            stockes en cache pendant {cacheDays} jours. Apres expiration, la
            prochaine visite relance les requetes et met a jour la page.
          </p>
        </details>
      </section>
    </main>
  );
}
