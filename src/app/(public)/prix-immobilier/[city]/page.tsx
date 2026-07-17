import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Home,
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
import { CityAddressSearch } from "./city-address-search";

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

// This page reads and may refresh the persistent Supabase cache at request time.
// Immo Data remains protected by the 90-day rule inside getCityMarketData.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: CityPricePageProps): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);

  if (!city) return {};

  return {
    title: `Prix au m² à ${city.name} (${city.postalCode}) | Les Jumelles Immo`,
    description: `Prix au m² à ${city.name} pour les appartements et maisons : évolution du marché et dernières ventes enregistrées.`,
    alternates: {
      canonical: `/prix-m2/${city.slug}`,
    },
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
  const sourceLabel = market.source === "immo-data" ? "Données Immo Data" : "Données indicatives";
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";
  const cacheDays = getMarketCacheDays();

  return (
    <main className="city-price-page city-price-modern">
      <nav className="city-breadcrumb city-modern-container" aria-label="Fil d’Ariane">
        <Link href="/">Accueil</Link><Link href="/prix-m2" title="Prix au m² par ville">Prix au m²</Link><span>{city.name}</span>
      </nav>

      <section className="city-modern-hero" aria-labelledby="city-price-title">
        <div className="city-modern-container city-modern-hero-grid">
          <div className="city-modern-hero-copy">
            <p className="city-section-kicker">Observatoire local · {city.postalCode}</p>
            <h1 id="city-price-title">Prix au m²<br />à {city.name}</h1>
            <div className="city-hero-price">
              <strong>{formatPrice(averagePrice)}</strong><span>/m²</span>
            </div>
            <p className="city-hero-intro">
              Une lecture claire du marché local pour estimer, acheter ou vérifier
              le prix d&apos;un bien à {city.name}.
            </p>

            <CityAddressSearch cityName={city.name} inseeCode={city.inseeCode} postalCode={city.postalCode} />

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

      <section className="city-market-overview city-modern-container" aria-labelledby="overview-title">
        <h2 className="city-visually-hidden" id="overview-title">Le marché en un coup d&apos;œil</h2>
        <div className="city-overview-grid">
          <MarketPriceCard icon={Building2} label="Appartement" stat={market.apartment} />
          <MarketPriceCard icon={Home} label="Maison" stat={market.house} />
          <article className="city-market-signal-card">
            <span>Évolution sur un an</span>
            <strong>{formatPercent(averageTrend)}</strong>
            <p>{Math.abs(averageTrend) < 1 ? "Un marché globalement stable" : averageTrend > 0 ? "Une dynamique haussière" : "Un marché en léger ajustement"}</p>
          </article>
        </div>
      </section>

      <section className="city-market-dashboard city-modern-container" aria-labelledby="trend-title">
        <div className="city-dashboard-chart">
          <div className="city-dashboard-title">
            <div><p className="city-section-kicker">Historique depuis 2014</p><h2 id="trend-title">Évolution des prix</h2></div>
            <div className="city-chart-legend"><span className="apartment">Appartement</span><span className="house">Maison</span></div>
          </div>
          <CityMarketChart averagePrice={averagePrice} cityName={city.name} points={market.history} />
        </div>

        <aside className="city-dashboard-side" id="ventes">
          <article className="city-sale-duration-card">
            <span><Clock3 size={22} /></span>
            <div><small>Délai moyen de vente</small><strong>{market.saleDurationDays ? `${market.saleDurationDays} jours` : "À qualifier"}</strong><p>Moyenne observée à {city.name}</p></div>
          </article>
          <article className="city-compact-sales" aria-labelledby="sales-title">
            <div><h2 id="sales-title">Dernières ventes</h2><span>{market.transactionCount ? `${euroFormatter.format(market.transactionCount)} disponibles` : sourceLabel}</span></div>
            {market.salePoints.slice(0, 3).map((sale) => (
              <div className="city-compact-sale-row" key={sale.id}>
                <div><span>{sale.propertyType}</span><strong>{sale.label}</strong><small>{sale.rooms || "—"} pièces · {sale.surfaceM2 || "—"} m²</small></div>
                <div><strong>{sale.price ? formatPrice(sale.price) : sale.pricePerM2 ? `${formatPrice(sale.pricePerM2)}/m²` : "Sur demande"}</strong><small>{sale.soldAt}</small></div>
              </div>
            ))}
          </article>
        </aside>

        <article className="city-analysis-strip">
          <i />
          <div><span>Notre analyse</span><strong>{Math.abs(averageTrend) < 1 ? "Le marché marque une phase de stabilité." : averageTrend > 0 ? "La demande continue de soutenir les prix." : "Les prix se rééquilibrent progressivement."}</strong></div>
          <p>La moyenne communale donne une tendance. L&apos;adresse, l&apos;état, l&apos;extérieur et le stationnement restent déterminants pour établir un prix précis.</p>
          <small>{sourceLabel} · Mise à jour le {formatDate(market.updatedAt)} · Cache {cacheDays} jours</small>
        </article>
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
              return <Link href={`/prix-m2/${nearbyCity.slug}`} key={nearbyCity.slug} title={`Prix m² à ${nearbyCity.name}`}><span>Prix m² à {nearbyCity.name}</span><strong>{formatPrice(price)}/m²</strong><ArrowRight size={15} /></Link>;
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
