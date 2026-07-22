import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
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

function getEstimationCity(citySlug: string) {
  const configuredCity = getCityBySlug(citySlug);

  if (!configuredCity) {
    throw new Error(`La ville ${citySlug} est absente de la configuration.`);
  }

  return configuredCity;
}

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Estimation immobilière à Aubagne | Maison et appartement",
  description: "Estimation immobilière à Aubagne pour une maison ou un appartement : prix au m², ventes récentes, quartiers et première estimation gratuite.",
  alternates: { canonical: "/estimation-immobiliere/aubagne" },
  robots: { index: true, follow: true },
};

const aubagneFaqs = [
  {
    question: "Une estimation en ligne suffit-elle pour fixer le prix de vente ?",
    answer:
      "Elle fournit un premier repère cohérent avec les données disponibles. Une visite reste nécessaire pour évaluer l’état réel, les travaux, la vue, les nuisances et les prestations.",
  },
  {
    question: "Pourquoi le prix au m² varie-t-il selon les quartiers d’Aubagne ?",
    answer:
      "Le type de logements, l’environnement, les accès et la rareté des ventes diffèrent d’un secteur à l’autre. Le prix communal sert donc de point de départ, pas de résultat final.",
  },
  {
    question: "Quels documents sont utiles pour affiner une estimation ?",
    answer:
      "Le diagnostic de performance énergétique, les plans, la taxe foncière, les factures de travaux et, en copropriété, les charges et derniers procès-verbaux facilitent l’analyse.",
  },
];

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

const aubagneFallbackZoneLabels = [
  "Centre-ville · Beaumond",
  "Charrel · Tourtelle",
  "Les Paluds · Camp Major",
  "Saint-Mitre · Beaudinard",
  "Garlaban · Passons",
];

function formatPrice(value: number) {
  return euroFormatter.format(value).replace(/\u202f/g, " ");
}

function formatDate(value: string) {
  if (/^[A-Za-zÀ-ÿ]+\s+\d{4}$/u.test(value)) return value;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function labelZones(zones: CityPriceZone[], citySlug: string) {
  if (citySlug !== "aubagne") return zones;

  return zones.map((zone, index) => ({
    ...zone,
    name: aubagneZoneLabels[zone.id] ?? aubagneFallbackZoneLabels[index] ?? zone.name,
  }));
}

function selectRecentSales(sales: CitySalePoint[]) {
  const valid = sales.filter((sale) => sale.surfaceM2 >= 20);
  const apartments = valid.filter((sale) => sale.propertyType === "Appartement").slice(0, 3);
  const houses = valid.filter((sale) => sale.propertyType === "Maison").slice(0, 3);

  return [...apartments, ...houses]
    .sort((left, right) => right.soldAt.localeCompare(left.soldAt))
    .slice(0, 6);
}

export default function AubagneEstimationPage() {
  return <CityEstimationPage citySlug="aubagne" />;
}

export async function CityEstimationPage({ citySlug }: { citySlug: string }) {
  const city = getEstimationCity(citySlug);
  const cityFaqs = aubagneFaqs.map((faq) => ({
    question: faq.question.replaceAll("Aubagne", city.name),
    answer: faq.answer.replaceAll("Aubagne", city.name),
  }));
  const cachedMarket = await readCityMarketCache(city);
  const market = cachedMarket?.data ?? getStaticCityMarketData(city);
  const zones = labelZones(market.zones, city.slug);
  const recentSales = selectRecentSales(market.salePoints);
  const averagePrice = Math.round(
    (market.apartment.averagePricePerM2 + market.house.averagePricePerM2) / 2,
  );
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";
  const pagePath = `/estimation-immobiliere/${city.slug}`;
  const localSectorNames = zones.slice(0, 9).map((zone) => zone.name).join(", ");
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Estimation immobilière", item: absoluteUrl("/estimation") },
          { "@type": "ListItem", position: 3, name: city.name, item: absoluteUrl(pagePath) },
        ],
      },
      {
        "@type": "Service",
        name: `Estimation immobilière à ${city.name}`,
        serviceType: ["Estimation de maison", "Estimation d’appartement"],
        areaServed: { "@type": "City", name: city.name },
        provider: { "@id": `${absoluteUrl("/")}#organization` },
        url: absoluteUrl(pagePath),
      },
      {
        "@type": "FAQPage",
        mainEntity: cityFaqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
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
        <span>{city.name}</span>
      </nav>

      <section className={styles.hero} aria-labelledby="aubagne-estimation-title">
        <div className={styles.heroMap}>
          <CityPriceMap
            accessToken={mapboxToken}
            center={{ latitude: city.latitude, longitude: city.longitude }}
            cityName={city.name}
            fitToSalePoints
            salePoints={market.salePoints.slice(0, 30)}
            salePointsFitMode="hero"
            zones={[]}
          />
        </div>
        <div className={styles.heroScrim} />
        <div className={styles.heroContent}>
          <p>Estimation immobilière · 13400</p>
          <h1 id="aubagne-estimation-title">Estimation immobilière à {city.name}</h1>
          <span>
            Quelle est la valeur de votre maison ou appartement à {city.name}&nbsp;? Obtenez
            une première estimation fondée sur les transactions locales, puis affinée
            selon les qualités réelles de votre bien.
          </span>
          <a href="#estimer">Estimer mon bien à {city.name} <ArrowRight aria-hidden="true" size={19} /></a>
          <small><MapPin aria-hidden="true" size={15} /> {market.salePoints.length} ventes récentes positionnées sur la carte</small>
        </div>
      </section>

      <section className={styles.estimationSection} id="estimer">
        <AubagneEstimationStarter cityName={city.name} inseeCode={city.inseeCode} />
      </section>

      <section className={styles.marketStrip} aria-labelledby="aubagne-prices-title">
        <div className={styles.sectionHeading}>
          <div>
            <p>Repères de marché</p>
            <h2 id="aubagne-prices-title">Les prix au m² à {city.name}</h2>
          </div>
          <Link href={`/prix-m2/${city.slug}`}>Voir les prix au m² à {city.name} <ArrowRight aria-hidden="true" size={17} /></Link>
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
                {sale.price && sale.pricePerM2 ? (
                  <>
                    <strong>{formatPrice(sale.price)}</strong>
                    <small>{formatPrice(sale.pricePerM2)}/m²</small>
                  </>
                ) : (
                  <>
                    <strong>Prix non communiqué</strong>
                    <small>Transaction localisée</small>
                  </>
                )}
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
          <h2 id="aubagne-trend-title">Maisons et appartements à {city.name} ne suivent pas toujours la même trajectoire</h2>
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
            <h2 id="aubagne-areas-title">Les grands secteurs de {city.name}</h2>
          </div>
          <span>
            {market.source === "immo-data"
              ? "Regroupements de quartiers construits à partir des codes IRIS INSEE–IGN"
              : "Aperçu local de secours, remplacé par le découpage IRIS lorsque le cache est disponible"}
          </span>
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

      <section className={styles.seoSection} aria-labelledby="aubagne-local-estimation-title">
        <header className={styles.seoLead}>
          <div>
            <p>Estimation locale</p>
            <h2 id="aubagne-local-estimation-title">
              Estimer une maison ou un appartement à {city.name}
            </h2>
          </div>
          <div className={styles.seoLeadCopy}>
            <p>
              Une estimation immobilière à {city.name} ne consiste pas seulement à multiplier une
              surface par un prix moyen. Deux biens de même taille peuvent présenter une valeur
              différente selon leur adresse, leur état, leurs prestations et les ventes réellement
              conclues autour d’eux.
            </p>
            <p>
              Notre première analyse croise le type de bien avec les transactions récentes et le
              secteur concerné{localSectorNames ? ` : ${localSectorNames}` : ""}. Une visite permet ensuite d’intégrer ce que la donnée
              seule ne peut pas mesurer.
            </p>
            <Link className={styles.agencyLink} href={`/agence-immobiliere/${city.slug}`}>
              Découvrir notre agence immobilière à {city.name}
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
          </div>
        </header>

        <div className={styles.propertyGuideGrid}>
          <article className={styles.propertyGuide}>
            <div className={styles.guideHeading}>
              <span><Home aria-hidden="true" size={24} /></span>
              <div>
                <small>Maison</small>
                <h3>Estimation d’une maison à {city.name}</h3>
              </div>
            </div>
            <p>
              Pour estimer une maison à {city.name}, la surface habitable doit être rapprochée de la
              taille et de l’usage du terrain. Les extérieurs, le stationnement et la qualité de
              l’environnement peuvent créer des écarts importants entre deux ventes voisines.
            </p>
            <ul className={styles.guideFactors}>
              <li><Check aria-hidden="true" size={16} /> Terrain, piscine, terrasse et dépendances</li>
              <li><Check aria-hidden="true" size={16} /> État général, travaux et performance énergétique</li>
              <li><Check aria-hidden="true" size={16} /> Calme, exposition, vue et facilité d’accès</li>
            </ul>
            <Link href="/estimation?propertyType=house">
              Estimer ma maison à {city.name} <ArrowRight aria-hidden="true" size={17} />
            </Link>
          </article>

          <article className={styles.propertyGuide}>
            <div className={styles.guideHeading}>
              <span><Building2 aria-hidden="true" size={24} /></span>
              <div>
                <small>Appartement</small>
                <h3>Estimation d’un appartement à {city.name}</h3>
              </div>
            </div>
            <p>
              L’estimation d’un appartement à {city.name} dépend du prix observé dans son secteur, mais
              aussi de l’immeuble et de la situation du logement. Un étage élevé, un extérieur ou un
              stationnement ne produisent pas le même effet selon la résidence et l’adresse.
            </p>
            <ul className={styles.guideFactors}>
              <li><Check aria-hidden="true" size={16} /> Étage, ascenseur, luminosité et agencement</li>
              <li><Check aria-hidden="true" size={16} /> Balcon, terrasse, cave, parking ou garage</li>
              <li><Check aria-hidden="true" size={16} /> Charges, copropriété, DPE et travaux votés</li>
            </ul>
            <Link href="/estimation?propertyType=apartment">
              Estimer mon appartement à {city.name} <ArrowRight aria-hidden="true" size={17} />
            </Link>
          </article>
        </div>

        <div className={styles.methodBand}>
          <div className={styles.methodHeading}>
            <p>Notre méthode</p>
            <h2>Comment calculons-nous votre estimation à {city.name}&nbsp;?</h2>
          </div>
          <ol className={styles.methodSteps}>
            <li>
              <span>01</span>
              <strong>Localiser précisément</strong>
              <p>L’adresse relie le bien à son secteur IRIS et aux ventes disponibles à proximité.</p>
            </li>
            <li>
              <span>02</span>
              <strong>Comparer les bons biens</strong>
              <p>Maison et appartement sont analysés séparément avec des surfaces comparables.</p>
            </li>
            <li>
              <span>03</span>
              <strong>Affiner par les prestations</strong>
              <p>L’état, les extérieurs, l’étage et les qualités propres au bien ajustent le repère statistique.</p>
            </li>
          </ol>
        </div>

        <div className={styles.faqBlock}>
          <div>
            <p>Questions fréquentes</p>
            <h2>Questions fréquentes sur l’estimation immobilière à {city.name}</h2>
          </div>
          <div className={styles.faqList}>
            {cityFaqs.map((faq) => (
              <details key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.finalCta}>
        <div>
          <p>Une donnée donne un repère. Une visite révèle la valeur.</p>
          <h2>Faisons le point sur votre bien à {city.name}.</h2>
        </div>
        <Link href="/estimation">Demander mon estimation à {city.name} <ArrowRight aria-hidden="true" size={19} /></Link>
      </section>
    </main>
  );
}
