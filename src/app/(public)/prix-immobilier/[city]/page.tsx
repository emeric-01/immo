import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  Home,
  MapPin,
  Search,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { getCityBySlug, getNearbyCities } from "@/lib/cities";
import {
  getCityMarketData,
  getStaticCityMarketData,
  type PropertyMarketStat,
} from "@/lib/city-market-data";
import { CityMarketChart } from "./city-market-chart";
import { CityPriceMap } from "./city-price-map";

type CityPricePageProps = {
  params: Promise<{ city: string }>;
};

const euroFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const decimalFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

function formatPrice(value: number) {
  return `${euroFormatter.format(value)} €`;
}

function formatPercent(value: number) {
  return `${value > 0 ? "+" : ""}${decimalFormatter.format(value)} %`;
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
  const days = Number(process.env.CITY_MARKET_REVALIDATE_DAYS ?? "90");
  return Number.isFinite(days) && days > 0 ? Math.round(days) : 90;
}

function MarketPriceCard({
  icon: Icon,
  label,
  stat,
}: {
  icon: typeof Building2;
  label: string;
  stat: PropertyMarketStat;
}) {
  const TrendIcon = stat.trend1Year >= 0 ? TrendingUp : TrendingDown;

  return (
    <article className="city-market-price-card">
      <span className="city-market-icon"><Icon size={20} /></span>
      <div>
        <span>{label}</span>
        <strong>{formatPrice(stat.averagePricePerM2)}<small>/m²</small></strong>
        <p>Fourchette {formatPrice(stat.lowPricePerM2)} — {formatPrice(stat.highPricePerM2)}</p>
      </div>
      <span className={stat.trend1Year >= 0 ? "city-trend positive" : "city-trend negative"}>
        <TrendIcon size={14} /> {formatPercent(stat.trend1Year)}
      </span>
    </article>
  );
}

export const revalidate = 7_776_000;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: CityPricePageProps): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);

  if (!city) return {};

  return {
    title: `Prix immobilier à ${city.name} (${city.postalCode}) | Les Jumelles Immo`,
    description: `Prix immobilier à ${city.name} : prix au m², évolution depuis 2014, quartiers, rues et dernières ventes enregistrées.`,
  };
}

export default async function CityPricePage({ params }: CityPricePageProps) {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);

  if (!city) notFound();

  const market = await getCityMarketData(city);
  const nearbyCities = getNearbyCities(city);
  const averagePrice = getAverageMarketPrice(
    market.apartment.averagePricePerM2,
    market.house.averagePricePerM2,
  );
  const averageTrend = Number(
    ((market.apartment.trend1Year + market.house.trend1Year) / 2).toFixed(1),
  );
  const maxNeighborhoodPrice = Math.max(
    ...market.neighborhoods.map((neighborhood) => neighborhood.pricePerM2),
    1,
  );
  const sourceLabel = market.source === "immo-data" ? "Données Immo Data" : "Données indicatives";
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";
  const cacheDays = getMarketCacheDays();

  return (
    <main className="city-price-page city-price-modern">
      <nav className="city-breadcrumb city-modern-container" aria-label="Fil d’Ariane">
        <Link href="/">Accueil</Link><span>Prix immobilier</span><span>{city.name}</span>
      </nav>

      <section className="city-modern-hero" aria-labelledby="city-price-title">
        <div className="city-modern-container city-modern-hero-grid">
          <div className="city-modern-hero-copy">
            <p className="city-section-kicker">Observatoire local · {city.postalCode}</p>
            <h1 id="city-price-title">Prix immobilier<br />à {city.name}</h1>
            <div className="city-hero-price">
              <strong>{formatPrice(averagePrice)}</strong><span>/m²</span>
            </div>
            <p className="city-hero-intro">
              Une lecture claire du marché local pour estimer, acheter ou vérifier
              le prix d&apos;un bien à {city.name}.
            </p>

            <form action="/estimation" className="city-address-form">
              <MapPin aria-hidden="true" size={20} />
              <input
                aria-label={`Adresse du bien à ${city.name}`}
                name="address"
                placeholder={`Saisissez votre adresse à ${city.name}`}
              />
              <button type="submit">Estimer mon bien <ArrowRight size={17} /></button>
            </form>

            <div className="city-trust-row">
              <span><ShieldCheck size={16} /> Données sécurisées</span>
              <span><CalendarDays size={16} /> Actualisé le {formatDate(market.updatedAt)}</span>
            </div>
          </div>

          <div className="city-modern-map-wrap">
            <CityPriceMap
              accessToken={mapboxToken}
              center={{ longitude: city.longitude, latitude: city.latitude }}
              cityName={city.name}
              salePoints={market.salePoints}
              zones={market.zones}
            />
          </div>
        </div>
      </section>

      <section className="city-intents city-modern-container" aria-label="Votre projet immobilier">
        <Link href="/estimation"><Home size={20} /><span><strong>Estimer mon bien</strong><small>Obtenir un avis de valeur personnalisé</small></span><ArrowRight size={18} /></Link>
        <Link href="/recherche"><Search size={20} /><span><strong>Préparer mon achat</strong><small>Définir les secteurs adaptés à mon budget</small></span><ArrowRight size={18} /></Link>
        <Link href="#ventes"><BarChart3 size={20} /><span><strong>Vérifier une annonce</strong><small>Comparer avec les ventes enregistrées</small></span><ArrowRight size={18} /></Link>
      </section>

      <section className="city-market-overview city-modern-container" aria-labelledby="overview-title">
        <div className="city-modern-heading">
          <div><p className="city-section-kicker">Les chiffres essentiels</p><h2 id="overview-title">Le marché en un coup d&apos;œil</h2></div>
          <p>{sourceLabel}, mises en cache côté serveur pendant {cacheDays} jours.</p>
        </div>
        <div className="city-overview-grid">
          <MarketPriceCard icon={Building2} label="Appartement" stat={market.apartment} />
          <MarketPriceCard icon={Home} label="Maison" stat={market.house} />
          <article className="city-market-signal-card">
            <span>Évolution sur un an</span>
            <strong>{formatPercent(averageTrend)}</strong>
            <p>{Math.abs(averageTrend) < 1 ? "Un marché globalement stable" : averageTrend > 0 ? "Une dynamique haussière" : "Un marché en léger ajustement"}</p>
          </article>
          <article className="city-market-signal-card">
            <span>Délai de vente observé</span>
            <strong>{market.saleDurationDays ? `${market.saleDurationDays} jours` : "À qualifier"}</strong>
            <p>{market.transactionCount ? `${euroFormatter.format(market.transactionCount)} transactions disponibles` : "Donnée locale selon disponibilité"}</p>
          </article>
        </div>
      </section>

      <section className="city-analysis-section city-modern-container" aria-labelledby="trend-title">
        <div className="city-modern-heading">
          <div><p className="city-section-kicker">Depuis 2014</p><h2 id="trend-title">Comment les prix ont évolué</h2></div>
          <div className="city-chart-legend"><span className="apartment">Appartement</span><span className="house">Maison</span></div>
        </div>
        <div className="city-analysis-grid">
          <CityMarketChart averagePrice={averagePrice} cityName={city.name} points={market.history} />
          <aside className="city-analysis-note">
            <span>Notre lecture</span>
            <h3>{Math.abs(averageTrend) < 1 ? "Le marché marque une phase de stabilité." : averageTrend > 0 ? "La demande continue de soutenir les prix." : "Les prix se rééquilibrent progressivement."}</h3>
            <p>La moyenne communale donne une tendance. L&apos;adresse, l&apos;état du bien, l&apos;extérieur et le stationnement restent déterminants pour établir un prix défendable.</p>
            <Link href="/estimation">Calculer la valeur de mon bien <ArrowRight size={16} /></Link>
          </aside>
        </div>
      </section>

      <section className="city-neighborhood-section city-modern-container" aria-labelledby="neighborhood-title">
        <div className="city-modern-heading">
          <div><p className="city-section-kicker">Lecture micro-locale</p><h2 id="neighborhood-title">Les prix secteur par secteur</h2></div>
          <p>Les secteurs suivent le découpage statistique disponible chez Immo Data.</p>
        </div>
        <div className="city-neighborhood-layout">
          <div className="city-neighborhood-ranking">
            {market.neighborhoods
              .slice()
              .sort((a, b) => b.pricePerM2 - a.pricePerM2)
              .map((neighborhood, index) => {
                const difference = ((neighborhood.pricePerM2 - averagePrice) / averagePrice) * 100;
                return (
                  <article key={neighborhood.name}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div><strong>{neighborhood.name}</strong><i><b style={{ width: `${(neighborhood.pricePerM2 / maxNeighborhoodPrice) * 100}%` }} /></i></div>
                    <div><strong>{formatPrice(neighborhood.pricePerM2)}<small>/m²</small></strong><span>{difference > 0 ? "+" : ""}{decimalFormatter.format(difference)} % vs ville</span></div>
                  </article>
                );
              })}
          </div>
          <aside className="city-streets-card">
            <p className="city-section-kicker">Repères par rue</p>
            <h3>Les écarts les plus marqués</h3>
            <div>
              {market.expensiveStreets.slice(0, 3).map((street) => <p key={street.name}><span>{street.name}</span><strong>{formatPrice(street.pricePerM2)}/m²</strong></p>)}
            </div>
            <small>Les prix par rue sont calculés à partir des transactions disponibles et doivent être interprétés selon le nombre de ventes.</small>
          </aside>
        </div>
      </section>

      <section className="city-sales-modern city-modern-container" id="ventes" aria-labelledby="sales-title">
        <div className="city-modern-heading">
          <div><p className="city-section-kicker">Transactions réelles</p><h2 id="sales-title">Dernières ventes enregistrées</h2></div>
          <p>Jusqu&apos;à 100 transactions récupérées par appel, filtrées pour la lecture.</p>
        </div>
        <div className="city-sales-list">
          {market.salePoints.slice(0, 6).map((sale) => (
            <article key={sale.id}>
              <span className="city-sale-icon">{sale.propertyType === "Maison" ? <Home size={19} /> : <Building2 size={19} />}</span>
              <div><span>Vendu · {sale.soldAt}</span><h3>{sale.label}</h3><p>{sale.propertyType} · {sale.rooms || "—"} pièces · {sale.surfaceM2 || "—"} m²</p></div>
              <div>{sale.pricePerM2 ? <strong>{formatPrice(sale.pricePerM2)}<small>/m²</small></strong> : <strong>Prix sur demande</strong>}{sale.price ? <span>{formatPrice(sale.price)} au total</span> : null}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="city-local-modern city-modern-container">
        <article>
          <p className="city-section-kicker">Cadre de vie</p><h2>{city.name} en quelques repères</h2>
          <dl>
            <div><dt>Population</dt><dd>{euroFormatter.format(market.localInfo.population)} habitants</dd></div>
            <div><dt>Densité</dt><dd>{euroFormatter.format(market.localInfo.density)} hab./km²</dd></div>
            <div><dt>Surface</dt><dd>{decimalFormatter.format(market.localInfo.areaKm2)} km²</dd></div>
            {market.localInfo.ownerShare ? <div><dt>Propriétaires</dt><dd>{decimalFormatter.format(market.localInfo.ownerShare)} %</dd></div> : null}
          </dl>
        </article>
        <article>
          <p className="city-section-kicker">Comparer</p><h2>Les villes voisines</h2>
          <div className="nearby-city-list">
            {nearbyCities.map((nearbyCity) => {
              const nearby = getStaticCityMarketData(nearbyCity);
              const price = getAverageMarketPrice(nearby.apartment.averagePricePerM2, nearby.house.averagePricePerM2);
              return <Link href={`/prix-immobilier/${nearbyCity.slug}`} key={nearbyCity.slug}><span>{nearbyCity.name}</span><strong>{formatPrice(price)}/m²</strong><ArrowRight size={15} /></Link>;
            })}
          </div>
        </article>
      </section>

      <section className="city-final-cta city-modern-container">
        <div><CheckCircle2 size={22} /><span>Estimation gratuite et confidentielle</span></div>
        <h2>La moyenne de {city.name} ne suffit pas à estimer votre bien.</h2>
        <p>Obtenez une estimation qui tient compte de votre adresse et des caractéristiques réelles du logement.</p>
        <Link href="/estimation">Estimer mon bien à {city.name} <ArrowRight size={18} /></Link>
      </section>

      <section className="city-faq-modern city-modern-container">
        <p className="city-section-kicker">Questions fréquentes</p><h2>Comprendre les prix à {city.name}</h2>
        <details open><summary>Quel est le prix moyen au m² à {city.name} ?</summary><p>Le prix moyen est estimé à {formatPrice(averagePrice)}/m², avec un écart important entre appartements, maisons, rues et secteurs.</p></details>
        <details><summary>Sur quelle période portent les données ?</summary><p>L&apos;historique agrégé remonte à janvier 2014. Les ventes récentes sont récupérées par lots de 100 puis mises en cache côté serveur.</p></details>
        <details><summary>Pourquoi le prix de mon bien peut-il être différent ?</summary><p>Étage, état, DPE, extérieur, vue, stationnement et qualité de la copropriété peuvent créer une décote ou une surcote significative.</p></details>
      </section>
    </main>
  );
}
