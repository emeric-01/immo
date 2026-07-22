import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  Home,
  MapPin,
  Ruler,
} from "lucide-react";
import { getCityBySlug } from "@/lib/cities";
import { readCityMarketCache } from "@/lib/city-market-cache";
import { getStaticCityMarketData, type CityPriceZone, type CitySalePoint } from "@/lib/city-market-data";
import { absoluteUrl } from "@/lib/site";
import { CityMarketChart } from "../../prix-immobilier/[city]/city-market-chart";
import { CityPriceMap } from "../../prix-immobilier/[city]/city-price-map";
import { AubagneEstimationStarter } from "./AubagneEstimationStarter";
import styles from "./aubagne-estimation.module.css";

function getAubagneCity() {
  const configuredCity = getCityBySlug("aubagne");

  if (!configuredCity) {
    throw new Error("La ville d'Aubagne est absente de la configuration.");
  }

  return configuredCity;
}

const city = getAubagneCity();

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Estimation immobilière à Aubagne | Les Jumelles Immo",
  description: "Estimez une maison ou un appartement à Aubagne à partir des prix locaux, des dernières ventes DVF et des caractéristiques du bien.",
  alternates: { canonical: "/estimation-immobiliere/aubagne" },
  robots: { index: false, follow: true },
};

const euroFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
  style: "currency",
  currency: "EUR",
});

const integerFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

const aubagneZoneLabels: Record<string, string> = {
  "1300501": "Centre-ville · Beaumond",
  "1300502": "Passons · Verdun",
  "1300503": "Pin Vert · Ceinture Est",
  "1300504": "Gavots · Bras d’Or · Camp Major",
  "1300505": "Tourtelle Nord · Tourtelle Sud",
  "1300506": "Longuillar · Pérussone · Charrel",
  "1300507": "Garlaban · Saint-Mitre · Beaudinard",
};

function formatPrice(value: number) {
  return euroFormatter.format(value).replace(/\u202f/g, " ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function labelZones(zones: CityPriceZone[]) {
  return zones.map((zone) => ({
    ...zone,
    name: aubagneZoneLabels[zone.id] ?? zone.name,
  }));
}

function selectRecentSales(sales: CitySalePoint[]) {
  const valid = sales.filter((sale) => sale.price && sale.pricePerM2 && sale.surfaceM2 >= 20);
  const apartments = valid.filter((sale) => sale.propertyType === "Appartement").slice(0, 3);
  const houses = valid.filter((sale) => sale.propertyType === "Maison").slice(0, 3);

  return [...apartments, ...houses]
    .sort((left, right) => right.soldAt.localeCompare(left.soldAt))
    .slice(0, 6);
}

export default async function AubagneEstimationPage() {
  const cachedMarket = await readCityMarketCache(city);
  const market = cachedMarket?.data ?? getStaticCityMarketData(city);
  const zones = labelZones(market.zones);
  const recentSales = selectRecentSales(market.salePoints);
  const averagePrice = Math.round(
    (market.apartment.averagePricePerM2 + market.house.averagePricePerM2) / 2,
  );
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Estimation immobilière", item: absoluteUrl("/estimation") },
          { "@type": "ListItem", position: 3, name: "Aubagne", item: absoluteUrl("/estimation-immobiliere/aubagne") },
        ],
      },
      {
        "@type": "Service",
        name: "Estimation immobilière à Aubagne",
        areaServed: { "@type": "City", name: "Aubagne" },
        provider: { "@id": `${absoluteUrl("/")}#organization` },
        url: absoluteUrl("/estimation-immobiliere/aubagne"),
      },
    ],
  };

  return (
    <main className={styles.page}>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        type="application/ld+json"
      />

      <nav className={styles.breadcrumb} aria-label="Fil d’Ariane">
        <Link href="/">Accueil</Link>
        <Link href="/estimation">Estimation</Link>
        <span>Aubagne</span>
      </nav>

      <section className={styles.hero} aria-labelledby="aubagne-estimation-title">
        <div className={styles.heroMap}>
          <CityPriceMap
            accessToken={mapboxToken}
            center={{ latitude: city.latitude, longitude: city.longitude }}
            cityName={city.name}
            salePoints={market.salePoints.slice(0, 30)}
            zones={zones}
          />
        </div>
        <div className={styles.heroScrim} />
        <div className={styles.heroContent}>
          <p>Estimation immobilière · 13400</p>
          <h1 id="aubagne-estimation-title">Quelle est la valeur de votre bien à Aubagne&nbsp;?</h1>
          <span>
            Une première lecture fondée sur les transactions locales, puis affinée
            selon les qualités réelles de votre maison ou appartement.
          </span>
          <a href="#estimer">Commencer mon estimation <ArrowRight aria-hidden="true" size={19} /></a>
          <small><MapPin aria-hidden="true" size={15} /> {market.salePoints.length} ventes récentes positionnées sur la carte</small>
        </div>
      </section>

      <section className={styles.estimationSection} id="estimer">
        <AubagneEstimationStarter />
      </section>

      <section className={styles.marketStrip} aria-labelledby="aubagne-prices-title">
        <div className={styles.sectionHeading}>
          <div>
            <p>Repères de marché</p>
            <h2 id="aubagne-prices-title">Les prix au m² à Aubagne</h2>
          </div>
          <Link href="/prix-m2/aubagne">Voir l’analyse complète <ArrowRight aria-hidden="true" size={17} /></Link>
        </div>
        <div className={styles.priceGrid}>
          <article>
            <Building2 aria-hidden="true" size={23} />
            <span>Appartement</span>
            <strong>{formatPrice(market.apartment.averagePricePerM2)}<small>/m²</small></strong>
            <p>{formatPrice(market.apartment.lowPricePerM2)} à {formatPrice(market.apartment.highPricePerM2)}</p>
          </article>
          <article>
            <Home aria-hidden="true" size={23} />
            <span>Maison</span>
            <strong>{formatPrice(market.house.averagePricePerM2)}<small>/m²</small></strong>
            <p>{formatPrice(market.house.lowPricePerM2)} à {formatPrice(market.house.highPricePerM2)}</p>
          </article>
          <article>
            <ChartNoAxesCombined aria-hidden="true" size={23} />
            <span>Transactions disponibles</span>
            <strong>{integerFormatter.format(market.transactionCount ?? market.salePoints.length)}</strong>
            <p>Mise à jour {formatDate(market.updatedAt)}</p>
          </article>
        </div>
      </section>

      <section className={styles.salesSection} aria-labelledby="aubagne-sales-title">
        <div className={styles.sectionHeading}>
          <div>
            <p>Demandes de valeurs foncières</p>
            <h2 id="aubagne-sales-title">Dernières ventes observées</h2>
          </div>
          <span>Adresses volontairement limitées au secteur ou à la voie</span>
        </div>
        <div className={styles.salesList}>
          {recentSales.map((sale) => (
            <article key={sale.id}>
              <span className={styles.saleType}>{sale.propertyType}</span>
              <div className={styles.saleAddress}>
                <strong>{sale.label}</strong>
                <small><CalendarDays aria-hidden="true" size={14} /> Vente du {formatDate(sale.soldAt)}</small>
              </div>
              <div className={styles.saleDetails}>
                <span><Ruler aria-hidden="true" size={15} /> {sale.surfaceM2} m²</span>
                <span>{sale.rooms} pièces</span>
              </div>
              <div className={styles.salePrice}>
                <strong>{formatPrice(sale.price ?? 0)}</strong>
                <small>{formatPrice(sale.pricePerM2 ?? 0)}/m²</small>
              </div>
            </article>
          ))}
        </div>
        <p className={styles.dvfNote}>
          Données DVF publiées par la DGFiP. Elles décrivent les mutations enregistrées et ne
          remplacent pas l’analyse de l’état, de la vue, des prestations ou des travaux du bien.
        </p>
      </section>

      <section className={styles.trendSection} aria-labelledby="aubagne-trend-title">
        <div className={styles.trendCopy}>
          <p>Évolution du marché</p>
          <h2 id="aubagne-trend-title">Maisons et appartements ne suivent pas toujours la même trajectoire</h2>
          <span>
            Le graphique replace votre projet dans la tendance observée. L’estimation finale
            s’appuie ensuite sur des biens réellement comparables autour de l’adresse.
          </span>
        </div>
        <div className={styles.chartWrap}>
          <CityMarketChart averagePrice={averagePrice} cityName={city.name} points={market.history} />
        </div>
      </section>

      <section className={styles.areasSection} aria-labelledby="aubagne-areas-title">
        <div className={styles.sectionHeading}>
          <div>
            <p>Découpage infra-communal</p>
            <h2 id="aubagne-areas-title">Les grands secteurs d’Aubagne</h2>
          </div>
          <span>Regroupements de quartiers construits à partir des codes IRIS INSEE–IGN</span>
        </div>
        <div className={styles.areaGrid}>
          {zones.map((zone, index) => (
            <article key={zone.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{zone.name}</strong>
                <small>Code secteur {zone.id}</small>
              </div>
              <p>{formatPrice(zone.pricePerM2)}<small>/m²</small></p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.finalCta}>
        <div>
          <p>Une donnée donne un repère. Une visite révèle la valeur.</p>
          <h2>Faisons le point sur votre bien à Aubagne.</h2>
        </div>
        <Link href="/estimation">Demander mon estimation <ArrowRight aria-hidden="true" size={19} /></Link>
      </section>
    </main>
  );
}
