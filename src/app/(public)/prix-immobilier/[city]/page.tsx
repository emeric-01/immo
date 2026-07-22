import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Calculator,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Database,
  Home,
  MapPinned,
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
import { createSocialImageUrl } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";

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

// This page reads and may refresh the persistent market cache at request time.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: CityPricePageProps): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);

  if (!city) return {};

  const title = `Prix m2 à ${city.name} (${city.postalCode}) : appartement et maison`;
  const socialTitle = `Prix au m² à ${city.name}`;
  const description = `Prix m2 à ${city.name} : prix des appartements et maisons, évolution du marché, dernières ventes DVF et estimation immobilière locale.`;
  const path = `/prix-m2/${city.slug}`;
  const socialImage = createSocialImageUrl({
    title: socialTitle,
    description,
    eyebrow: `Observatoire local · ${city.postalCode}`,
  });
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      siteName: "Les Jumelles Immo",
      title: socialTitle,
      description,
      url: path,
      images: [{ url: socialImage, width: 1200, height: 630, alt: socialTitle }],
    },
    twitter: { card: "summary_large_image", title: socialTitle, description, images: [socialImage] },
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
  const sourceLabel = market.source === "immo-data" ? "Transactions DVF agrégées" : "Repères indicatifs";
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";
  const faqs = [
    {
      question: `Quel est le prix moyen au m² à ${city.name} ?`,
      answer: `Le prix moyen observé à ${city.name} est de ${formatPrice(averagePrice)}/m². Cette moyenne communale réunit des biens différents : un appartement se situe autour de ${formatPrice(market.apartment.averagePricePerM2)}/m² et une maison autour de ${formatPrice(market.house.averagePricePerM2)}/m².`,
    },
    {
      question: `Quel est le prix au m² d’un appartement à ${city.name} ?`,
      answer: `Le prix moyen d’un appartement à ${city.name} est estimé à ${formatPrice(market.apartment.averagePricePerM2)}/m², avec une fourchette observée de ${formatPrice(market.apartment.lowPricePerM2)} à ${formatPrice(market.apartment.highPricePerM2)}/m². L’étage, l’ascenseur, l’état, la terrasse, la vue, le stationnement et la copropriété expliquent une partie des écarts.`,
    },
    {
      question: `Quel est le prix au m² d’une maison à ${city.name} ?`,
      answer: `Le prix moyen d’une maison à ${city.name} est estimé à ${formatPrice(market.house.averagePricePerM2)}/m², dans une fourchette de ${formatPrice(market.house.lowPricePerM2)} à ${formatPrice(market.house.highPricePerM2)}/m². Le terrain, l’exposition, les extérieurs, la piscine, les dépendances et les travaux pèsent fortement dans l’estimation finale.`,
    },
    {
      question: `Comment connaître le prix au m² d’une adresse ou d’un quartier à ${city.name} ?`,
      answer: `Le prix d’une rue ou d’un quartier se vérifie en rapprochant les transactions DVF récentes de biens comparables. Saisissez l’adresse du logement sur cette page pour lancer une estimation plus précise, puis confrontez ce repère à l’état et aux prestations réelles du bien.`,
    },
    {
      question: `Comment le prix au m² à ${city.name} est-il calculé ?`,
      answer: `Les repères sont établis à partir des transactions immobilières publiées dans la base DVF de la DGFiP. Les ventes sont regroupées par commune, secteur et type de bien, puis rapportées à la surface connue. Les mutations atypiques ou les informations incomplètes doivent toujours être interprétées avec prudence.`,
    },
    {
      question: `Le prix moyen au m² suffit-il pour estimer un bien à ${city.name} ?`,
      answer: `Non. Le prix moyen situe le marché, mais une estimation fiable doit aussi intégrer l’adresse, l’état, la luminosité, le DPE, l’extérieur, le stationnement, les travaux et les qualités propres au logement. Une visite permet de transformer ce repère statistique en avis de valeur argumenté.`,
    },
  ];
  const cityJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Prix au m²", item: absoluteUrl("/prix-m2") },
        { "@type": "ListItem", position: 3, name: city.name, item: absoluteUrl(`/prix-m2/${city.slug}`) },
      ] },
      { "@type": "WebPage", "@id": `${absoluteUrl(`/prix-m2/${city.slug}`)}#webpage`, name: `Prix au m² à ${city.name}`, url: absoluteUrl(`/prix-m2/${city.slug}`), description: `Prix des appartements et maisons à ${city.name}, tendances et transactions immobilières locales.`, about: { "@type": "Place", name: city.name, postalCode: city.postalCode, geo: { "@type": "GeoCoordinates", latitude: city.latitude, longitude: city.longitude } }, isPartOf: { "@id": `${absoluteUrl("/")}#website` } },
      { "@type": "FAQPage", mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) },
    ],
  };

  return (
    <main className="city-price-page city-price-modern">
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(cityJsonLd).replace(/</g, "\\u003c") }} type="application/ld+json" />
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

      <section className="city-property-guide city-modern-container" aria-labelledby="property-price-title">
        <div className="city-property-guide-heading">
          <div>
            <p className="city-section-kicker">Prix immobilier à {city.name}</p>
            <h2 id="property-price-title">Prix au m² des appartements et maisons à {city.name}</h2>
          </div>
          <p>
            Le prix au m² permet de situer rapidement un projet, à condition de comparer
            des biens de même nature et dans un environnement proche.
          </p>
        </div>
        <div className="city-property-guide-grid">
          <article>
            <span><Building2 size={21} /></span>
            <div>
              <h3>Prix m² appartement à {city.name}</h3>
              <strong>{formatPrice(market.apartment.averagePricePerM2)}<small>/m²</small></strong>
              <p>
                Les appartements observés se situent généralement entre {formatPrice(market.apartment.lowPricePerM2)} et {formatPrice(market.apartment.highPricePerM2)}/m².
                L’étage, l’extérieur, le stationnement et l’état de la copropriété affinent ce repère.
              </p>
            </div>
          </article>
          <article>
            <span><Home size={21} /></span>
            <div>
              <h3>Prix m² maison à {city.name}</h3>
              <strong>{formatPrice(market.house.averagePricePerM2)}<small>/m²</small></strong>
              <p>
                Les maisons observées évoluent entre {formatPrice(market.house.lowPricePerM2)} et {formatPrice(market.house.highPricePerM2)}/m².
                La parcelle, la vue, les annexes et les travaux rendent la comparaison plus sélective.
              </p>
            </div>
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
          <small>{sourceLabel} · Mise à jour le {formatDate(market.updatedAt)}</small>
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

      <section className="city-dvf-method city-modern-container" aria-labelledby="dvf-method-title">
        <div className="city-dvf-method-copy">
          <p className="city-section-kicker">Méthode et source</p>
          <h2 id="dvf-method-title">Comment connaître le prix au m² à {city.name} ?</h2>
          <p>
            Nos repères s’appuient sur les transactions immobilières enregistrées dans la
            base publique DVF. Elles donnent une lecture factuelle des ventes signées, puis
            sont regroupées par type de bien et par secteur pour calculer un prix au m² cohérent.
          </p>
          <p>
            Cette donnée constitue un point de départ. Deux logements de même surface peuvent
            avoir des valeurs différentes selon leur adresse, leur état, leur exposition, leur
            performance énergétique ou la présence d’un extérieur.
          </p>
        </div>
        <ol className="city-dvf-steps">
          <li><span><Database size={19} /></span><div><strong>1. Transactions DVF</strong><p>Lecture des ventes immobilières publiées par la DGFiP.</p></div></li>
          <li><span><Calculator size={19} /></span><div><strong>2. Calcul par typologie</strong><p>Comparaison des prix au m² des appartements et des maisons.</p></div></li>
          <li><span><MapPinned size={19} /></span><div><strong>3. Analyse locale</strong><p>Ajustement selon le quartier, l’adresse et les caractéristiques du bien.</p></div></li>
        </ol>
      </section>

      <section className="city-project-links city-modern-container" aria-labelledby="city-project-title">
        <div>
          <p className="city-section-kicker">Votre projet à {city.name}</p>
          <h2 id="city-project-title">Passer du prix moyen à votre bien</h2>
          <p>Utilisez les données du marché pour cadrer votre projet, puis obtenez une analyse adaptée à votre adresse.</p>
        </div>
        <div className="city-project-link-list">
          <Link href={`/estimation-immobiliere/${city.slug}`}>
            <span><Calculator size={20} /></span>
            <div><strong>Estimation immobilière à {city.name}</strong><small>Maison ou appartement, à partir de votre adresse</small></div>
            <ArrowRight size={18} />
          </Link>
          <Link href={`/agence-immobiliere/${city.slug}`}>
            <span><Home size={20} /></span>
            <div><strong>Agence immobilière à {city.name}</strong><small>Estimer, valoriser et vendre avec un accompagnement local</small></div>
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <section className="city-final-cta city-modern-container">
        <div><CheckCircle2 size={22} /><span>Estimation gratuite et confidentielle</span></div>
        <h2>La moyenne de {city.name} ne suffit pas à estimer votre bien.</h2>
        <p>Obtenez une estimation qui tient compte de votre adresse et des caractéristiques réelles du logement.</p>
        <Link href={`/estimation-immobiliere/${city.slug}`}>Estimer mon bien à {city.name} <ArrowRight size={18} /></Link>
      </section>

      <section className="city-faq-modern city-modern-container">
        <p className="city-section-kicker">Questions fréquentes</p><h2>FAQ sur le prix m² à {city.name}</h2>
        {faqs.map((faq, index) => (
          <details key={faq.question} open={index === 0}>
            <summary>{faq.question}</summary>
            <p>{faq.answer}</p>
          </details>
        ))}
      </section>
    </main>
  );
}
