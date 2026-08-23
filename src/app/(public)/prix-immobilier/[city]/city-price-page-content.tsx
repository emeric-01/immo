import type { Metadata } from "next";
import type { CSSProperties } from "react";
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
import {
  getLocalMarketCityBySlug,
  getNearbyLocalMarketCities,
  type City,
} from "@/lib/cities";
import {
  getCityMarketDataSet,
  type CityMarketData,
  type CitySalePoint,
  type PropertyMarketStat,
} from "@/lib/city-market-data";
import {
  getAubagneNearbyPreviewPrice,
  getCityPricePreviewSnapshot,
} from "@/lib/city-price-preview-data";
import { getLocalAgencyNeighborhoodProfile } from "@/lib/local-agency-neighborhoods";
import { aubagneDvfPreviewZones } from "@/lib/aubagne-dvf-preview-data";
import { getInterkabMarketPulse } from "@/lib/interkab-market-pulse";
import { AubagneDvfPreviewMap } from "./aubagne-dvf-preview-map";
import { CityMarketChart } from "./city-market-chart";
import { CityPriceMap } from "./city-price-map";
import { CityAddressSearch } from "./city-address-search";
import { createSocialImageUrl } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";
import previewStyles from "./city-price-preview.module.css";

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

function formatMonthYear(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

function formatIrisObservationLabel(stat: { observations: number; reliability: string }) {
  const saleLabel = `${stat.observations} vente${stat.observations > 1 ? "s" : ""}`;
  if (stat.reliability === "insufficient") return `${saleLabel} locale${stat.observations > 1 ? "s" : ""} · prix communal`;
  if (stat.reliability === "exploratory") return `${saleLabel} comparable${stat.observations > 1 ? "s" : ""} · faible échantillon`;
  return `${saleLabel} comparable${stat.observations > 1 ? "s" : ""}`;
}

function getAverageMarketPrice(apartment: number, house: number) {
  return Math.round((apartment + house) / 2);
}

function getMarketRangeStyle(value: number, low: number, high: number) {
  const rangeWidth = high - low;
  const position = rangeWidth > 0
    ? Math.min(100, Math.max(0, ((value - low) / rangeWidth) * 100))
    : 50;
  return { "--market-range-position": `${position}%` } as CSSProperties;
}

function getLatestObservedSaleDate(salePoints: CitySalePoint[]) {
  const timestamps = salePoints
    .map((sale) => new Date(sale.soldAt).getTime())
    .filter(Number.isFinite);

  if (timestamps.length === 0) return null;
  return new Date(Math.max(...timestamps)).toISOString();
}

function MarketPriceCard({
  centralLabel = "Moyenne",
  icon: Icon,
  label,
  stat,
}: {
  centralLabel?: string;
  icon: typeof Building2;
  label: string;
  stat: PropertyMarketStat;
}) {
  const hasObservedTrend = stat.trendSource !== "unavailable";
  const TrendIcon = stat.trend1Year >= 0 ? TrendingUp : TrendingDown;
  const rangeStyle = getMarketRangeStyle(
    stat.averagePricePerM2,
    stat.lowPricePerM2,
    stat.highPricePerM2,
  );

  return (
    <article className="city-market-price-card">
      <span className="city-market-icon"><Icon size={20} /></span>
      <div className="city-market-card-content">
        <span>{label}</span>
        <strong>{formatPrice(stat.averagePricePerM2)}<small>/m²</small></strong>
        <div className="city-market-range" style={rangeStyle}>
          <div className="city-market-range-values">
            <span>{stat.rangeSource === "transactions" ? "Fourchette observée" : "Fourchette indicative"}</span>
            <strong>
              {formatPrice(stat.lowPricePerM2)}
              <small>à</small>
              {formatPrice(stat.highPricePerM2)}
              <em>/m²</em>
            </strong>
          </div>
          <div className="city-market-range-track" aria-hidden="true"><span /></div>
          <div className="city-market-range-labels" aria-hidden="true">
            <span>Prix bas</span><span>{centralLabel}</span><span>Prix haut</span>
          </div>
        </div>
      </div>
      <span className={hasObservedTrend ? (stat.trend1Year >= 0 ? "city-trend positive" : "city-trend negative") : "city-trend"}>
        {hasObservedTrend ? <><TrendIcon size={14} /> {formatPercent(stat.trend1Year)}</> : "Évolution à venir"}
      </span>
    </article>
  );
}

function CityMarketUnavailable({ city }: { city: City }) {
  return (
    <main className="city-price-page city-price-modern">
      <nav className="city-breadcrumb city-modern-container" aria-label="Fil d’Ariane">
        <Link href="/">Accueil</Link><Link href="/prix-m2">Prix au m²</Link><span>{city.name}</span>
      </nav>
      <section className="city-modern-hero" aria-labelledby="city-price-title">
        <div className="city-modern-container city-modern-hero-grid">
          <div className="city-modern-hero-copy">
            <p className="city-section-kicker">Observatoire local · {city.postalCode}</p>
            <h1 id="city-price-title">Prix au m²<br />à {city.name}</h1>
            <p className="city-hero-intro">
              Aucun snapshot de marché vérifié n’est encore publié pour cette commune.
              Nous préférons ne pas afficher de prix artificiel.
            </p>
            <Link href="/estimation">Demander une estimation personnalisée <ArrowRight size={17} /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function CityMarketDashboard({
  averagePrice,
  averageTrend,
  city,
  market,
  seoPreview,
  showTrendCard,
  sourceLabel,
}: {
  averagePrice: number;
  averageTrend: number | null;
  city: City;
  market: CityMarketData;
  seoPreview: boolean;
  showTrendCard: boolean;
  sourceLabel: string;
}) {
  const TrendIcon = averageTrend === null ? Clock3 : averageTrend >= 0 ? TrendingUp : TrendingDown;
  const marketTrendLabel = averageTrend === null
    ? "Historique encore insuffisant"
    : Math.abs(averageTrend) < 1
      ? "Marché globalement stable"
      : averageTrend > 0
        ? "Dynamique haussière"
        : "Marché en léger ajustement";

  return (
    <section className="city-market-dashboard city-modern-container" aria-labelledby="trend-title">
      <div className="city-dashboard-chart">
        <div className="city-dashboard-title">
          <div><p className="city-section-kicker">Historique du marché</p><h2 id="trend-title">Évolution des prix</h2></div>
          {market.history.length > 0 ? <div className="city-chart-legend"><span className="apartment">Appartement</span><span className="house">Maison</span></div> : null}
        </div>
        {market.history.length > 0
          ? <CityMarketChart averagePrice={seoPreview ? undefined : averagePrice} cityName={city.name} points={market.history} />
          : <p>L’historique vérifié n’est pas encore disponible pour cette commune.</p>}
      </div>

      <aside className="city-dashboard-side" id="ventes">
        <article className={`city-sale-duration-card ${showTrendCard ? previewStyles.dashboardTrendCard : ""}`}>
          <span><TrendIcon size={22} /></span>
          {showTrendCard ? (
            <div>
              <small>Tendance du marché sur un an</small>
              <strong>{averageTrend !== null ? formatPercent(averageTrend) : "À venir"}</strong>
              <p>
                Appartement {market.apartment.trendSource !== "unavailable" ? formatPercent(market.apartment.trend1Year) : "à venir"}
                <span aria-hidden="true"> · </span>
                Maison {market.house.trendSource !== "unavailable" ? formatPercent(market.house.trend1Year) : "à venir"}
              </p>
              <em>{marketTrendLabel}</em>
            </div>
          ) : (
            <div><small>Délai moyen de vente</small><strong>{market.saleDurationDays ? `${market.saleDurationDays} jours` : "À qualifier"}</strong><p>Moyenne observée à {city.name}</p></div>
          )}
        </article>
        <article className="city-compact-sales" aria-labelledby="sales-title">
          <div><h2 id="sales-title">Dernières ventes</h2><span>{market.transactionCount ? `${euroFormatter.format(market.transactionCount)} disponibles` : sourceLabel}</span></div>
          {market.salePoints.slice(0, 3).map((sale) => (
            <div className="city-compact-sale-row" key={sale.id}>
              <div><span>{sale.propertyType}</span><strong>{sale.label}</strong><small>{sale.rooms || "—"} pièces · {sale.surfaceM2 || "—"} m²</small></div>
              <div><strong>{sale.price ? formatPrice(sale.price) : sale.pricePerM2 ? `${formatPrice(sale.pricePerM2)}/m²` : "Sur demande"}</strong><small>{sale.soldAt}</small></div>
            </div>
          ))}
          {market.salePoints.length === 0 ? <p>Aucune transaction localisée vérifiée n’est publiée pour le moment.</p> : null}
        </article>
      </aside>

      <article className="city-analysis-strip">
        <i />
        <div><span>Notre analyse</span><strong>{seoPreview ? `À ${city.name}, maisons et appartements suivent des marchés différents.` : averageTrend === null ? "La tendance annuelle reste à qualifier." : Math.abs(averageTrend) < 1 ? "Le marché marque une phase de stabilité." : averageTrend > 0 ? "La demande continue de soutenir les prix." : "Les prix se rééquilibrent progressivement."}</strong></div>
        <p>{seoPreview ? `Les secteurs de maisons, la taille des parcelles, les vues vers le Garlaban, l’accès et le niveau de rénovation créent des écarts que la moyenne communale ne peut pas résumer.` : "La moyenne communale donne une tendance. L’adresse, l’état, l’extérieur et le stationnement restent déterminants pour établir un prix précis."}</p>
        <small>{sourceLabel} · Mise à jour le {formatDate(market.updatedAt)}</small>
      </article>
    </section>
  );
}

// Canonical requests only read published snapshots. Refreshes are admin-only.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: CityPricePageProps): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = getLocalMarketCityBySlug(citySlug);

  if (!city) return { robots: { index: false, follow: false } };

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
  return renderCityPricePage(citySlug, false);
}

export async function CityPriceSeoPreview({ citySlug }: { citySlug: string }) {
  return renderCityPricePage(citySlug, true);
}

async function renderCityPricePage(citySlug: string, seoPreview: boolean) {
  const city = getLocalMarketCityBySlug(citySlug);

  if (!city) notFound();

  const nearbyCities = getNearbyLocalMarketCities(city);
  const previewMarket = seoPreview ? getCityPricePreviewSnapshot(city.slug) : null;
  const marketSnapshots = previewMarket
    ? new Map<string, CityMarketData>()
    : await getCityMarketDataSet([city, ...nearbyCities]);
  const market = previewMarket ?? marketSnapshots.get(city.inseeCode);

  if (!market) return <CityMarketUnavailable city={city} />;

  const currentMarketPulse = seoPreview && city.slug === "aubagne"
    ? await getInterkabMarketPulse(
      city.inseeCode,
      market.apartment.averagePricePerM2,
      market.house.averagePricePerM2,
    )
    : null;

  const apartmentMarketReference = currentMarketPulse?.apartment?.nowcastPricePerM2
    ?? market.apartment.averagePricePerM2;
  const houseMarketReference = currentMarketPulse?.house?.nowcastPricePerM2
    ?? market.house.averagePricePerM2;
  const hasCurrentMarketReference = Boolean(
    currentMarketPulse?.apartment?.nowcastPricePerM2
    || currentMarketPulse?.house?.nowcastPricePerM2,
  );
  const apartmentOverviewStat = hasCurrentMarketReference
    ? { ...market.apartment, averagePricePerM2: apartmentMarketReference }
    : market.apartment;
  const houseOverviewStat = hasCurrentMarketReference
    ? { ...market.house, averagePricePerM2: houseMarketReference }
    : market.house;
  const apartmentHeroRangeStyle = getMarketRangeStyle(
    apartmentMarketReference,
    market.apartment.lowPricePerM2,
    market.apartment.highPricePerM2,
  );
  const houseHeroRangeStyle = getMarketRangeStyle(
    houseMarketReference,
    market.house.lowPricePerM2,
    market.house.highPricePerM2,
  );

  const averagePrice = getAverageMarketPrice(
    apartmentMarketReference,
    houseMarketReference,
  );
  const averageTrend = market.apartment.trendSource === "history" && market.house.trendSource === "history" ? Number(
    ((market.apartment.trend1Year + market.house.trend1Year) / 2).toFixed(1),
  ) : null;
  const sourceLabel = market.source === "dvf"
    ? "Transactions DVF · DGFiP / data.gouv.fr"
    : market.source === "immo-data"
      ? "Transactions DVF agrégées"
      : "Repères indicatifs";
  const usesDvfMedian = market.source === "dvf";
  const latestObservedSaleDate = getLatestObservedSaleDate(market.salePoints);
  const marketReferenceUpdatedAt = currentMarketPulse?.updatedAt ?? market.updatedAt;
  const neighborhoodProfile = seoPreview
    ? getLocalAgencyNeighborhoodProfile(city.slug)
    : null;
  const previewNeighborhoods = neighborhoodProfile?.neighborhoods.slice(0, 4) ?? [];
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";
  const faqs = [
    {
      question: seoPreview
        ? `Quels sont les prix au m² des appartements et des maisons à ${city.name} ?`
        : `Quel est le prix moyen au m² à ${city.name} ?`,
      answer: seoPreview
        ? `${hasCurrentMarketReference ? "Selon le Repère Marché Les Jumelles" : "Selon les médianes DVF publiées"}, un appartement à ${city.name} se situe autour de ${formatPrice(apartmentMarketReference)}/m² et une maison autour de ${formatPrice(houseMarketReference)}/m². Ces deux repères sont volontairement séparés : les réunir masquerait les différences de typologie et de nombre de ventes.`
        : `Le prix moyen observé à ${city.name} est de ${formatPrice(averagePrice)}/m². Cette moyenne communale réunit des biens différents : un appartement se situe autour de ${formatPrice(market.apartment.averagePricePerM2)}/m² et une maison autour de ${formatPrice(market.house.averagePricePerM2)}/m².`,
    },
    {
      question: `Quel est le prix au m² d’un appartement à ${city.name} ?`,
      answer: `${hasCurrentMarketReference ? "Le Repère Marché Les Jumelles" : usesDvfMedian ? "Le prix médian DVF" : "Le prix moyen"} d’un appartement à ${city.name} est de ${formatPrice(apartmentMarketReference)}/m². Les ventes DVF comparables s’inscrivent dans une fourchette observée de ${formatPrice(market.apartment.lowPricePerM2)} à ${formatPrice(market.apartment.highPricePerM2)}/m². L’étage, l’ascenseur, l’état, la terrasse, la vue, le stationnement et la copropriété expliquent une partie des écarts.`,
    },
    {
      question: `Quel est le prix au m² d’une maison à ${city.name} ?`,
      answer: `${hasCurrentMarketReference ? "Le Repère Marché Les Jumelles" : usesDvfMedian ? "Le prix médian DVF" : "Le prix moyen"} d’une maison à ${city.name} est de ${formatPrice(houseMarketReference)}/m². Les ventes DVF comparables s’inscrivent dans une fourchette observée de ${formatPrice(market.house.lowPricePerM2)} à ${formatPrice(market.house.highPricePerM2)}/m². Le terrain, l’exposition, les extérieurs, la piscine, les dépendances et les travaux pèsent fortement dans l’estimation finale.`,
    },
    {
      question: `Comment connaître le prix au m² d’une adresse ou d’un quartier à ${city.name} ?`,
      answer: `Le prix d’une rue ou d’un quartier se vérifie en rapprochant les transactions DVF récentes de biens comparables. Saisissez l’adresse du logement sur cette page pour lancer une estimation plus précise, puis confrontez ce repère à l’état et aux prestations réelles du bien.`,
    },
    {
      question: `Comment le prix au m² à ${city.name} est-il calculé ?`,
      answer: hasCurrentMarketReference
        ? `Le Repère Marché Les Jumelles part des transactions immobilières DVF publiées par la DGFiP, puis mesure prudemment le signal donné par les offres professionnelles actives comparables. Les terrains, viagers, locaux, valeurs incohérentes et doublons détectables sont exclus. Le prix demandé n’est jamais assimilé à un prix vendu.`
        : `Les repères sont établis à partir des transactions immobilières publiées dans la base DVF de la DGFiP. Les ventes sont regroupées par commune, secteur et type de bien, puis rapportées à la surface connue. Les mutations atypiques ou les informations incomplètes doivent toujours être interprétées avec prudence.`,
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
    <main className={`city-price-page city-price-modern ${seoPreview ? previewStyles.previewPage : ""}`}>
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(cityJsonLd).replace(/</g, "\\u003c") }} type="application/ld+json" />
      <nav className="city-breadcrumb city-modern-container" aria-label="Fil d’Ariane">
        <Link href="/">Accueil</Link><Link href="/prix-m2" title="Prix au m² par ville">Prix au m²</Link><span>{city.name}</span>
      </nav>

      <section className="city-modern-hero" aria-labelledby="city-price-title">
        <div className="city-modern-container city-modern-hero-grid">
          <div className="city-modern-hero-copy">
            <p className="city-section-kicker">Observatoire local · {city.postalCode}</p>
            <h1 id="city-price-title">Prix au m²<br />à {city.name}</h1>
            {seoPreview ? (
              <dl className={`${previewStyles.heroPrices} ${hasCurrentMarketReference ? previewStyles.heroPricesCurrent : ""}`}>
                <div>
                  <dt>
                    Appartement
                    {hasCurrentMarketReference ? <span>Repère Marché</span> : usesDvfMedian ? " · médiane DVF" : ""}
                  </dt>
                  <dd>
                    <span className={previewStyles.heroPriceIcon}><Building2 aria-hidden="true" size={22} /></span>
                    <span className={previewStyles.heroPriceAmount}>{formatPrice(apartmentMarketReference)}<small>/m²</small></span>
                  </dd>
                  {hasCurrentMarketReference && currentMarketPulse?.apartment ? (
                    <>
                      <div className={previewStyles.heroMarketRange} style={apartmentHeroRangeStyle}>
                        <div>
                          <span>Fourchette des ventes DVF</span>
                          <strong>{formatPrice(market.apartment.lowPricePerM2)} à {formatPrice(market.apartment.highPricePerM2)}<small>/m²</small></strong>
                        </div>
                        <i aria-hidden="true"><b /></i>
                        <small><span>Prix bas</span><span>Repère Marché</span><span>Prix haut</span></small>
                      </div>
                    </>
                  ) : usesDvfMedian ? (
                    <span className={previewStyles.heroPriceRange}>
                      Fourchette observée : {formatPrice(market.apartment.lowPricePerM2)} à {formatPrice(market.apartment.highPricePerM2)}/m²
                    </span>
                  ) : null}
                </div>
                <div>
                  <dt>
                    Maison
                    {hasCurrentMarketReference ? <span>Repère Marché</span> : usesDvfMedian ? " · médiane DVF" : ""}
                  </dt>
                  <dd>
                    <span className={previewStyles.heroPriceIcon}><Home aria-hidden="true" size={22} /></span>
                    <span className={previewStyles.heroPriceAmount}>{formatPrice(houseMarketReference)}<small>/m²</small></span>
                  </dd>
                  {hasCurrentMarketReference && currentMarketPulse?.house ? (
                    <>
                      <div className={previewStyles.heroMarketRange} style={houseHeroRangeStyle}>
                        <div>
                          <span>Fourchette des ventes DVF</span>
                          <strong>{formatPrice(market.house.lowPricePerM2)} à {formatPrice(market.house.highPricePerM2)}<small>/m²</small></strong>
                        </div>
                        <i aria-hidden="true"><b /></i>
                        <small><span>Prix bas</span><span>Repère Marché</span><span>Prix haut</span></small>
                      </div>
                    </>
                  ) : usesDvfMedian ? (
                    <span className={previewStyles.heroPriceRange}>
                      Fourchette observée : {formatPrice(market.house.lowPricePerM2)} à {formatPrice(market.house.highPricePerM2)}/m²
                    </span>
                  ) : null}
                </div>
              </dl>
            ) : (
              <div className="city-hero-price">
                <strong>{formatPrice(averagePrice)}</strong><span>/m²</span>
              </div>
            )}
            {seoPreview && hasCurrentMarketReference ? (
              <div className={previewStyles.heroConversion}>
                <strong>Votre bien se situe-t-il au-dessus ou en dessous du marché à {city.name} ?</strong>
                <p>
                  Le prix au m² donne un premier repère dans une fourchette de marché. L’adresse,
                  le quartier, l’état, la vue, l’extérieur, le stationnement et les prestations
                  doivent ensuite être étudiés pour obtenir une estimation proche de la réalité.
                </p>
              </div>
            ) : (
              <p className="city-hero-intro">
                {seoPreview
                  ? `${usesDvfMedian ? "Deux médianes DVF" : "Deux repères distincts"} pour lire le marché de ${city.name} sans mélanger des biens qui ne se comparent pas.`
                  : `Une lecture claire du marché local pour estimer, acheter ou vérifier le prix d'un bien à ${city.name}.`}
              </p>
            )}

            <CityAddressSearch
              allowAnyCity={seoPreview}
              buttonLabel={hasCurrentMarketReference ? "Situer mon bien" : undefined}
              cityName={city.name}
              inseeCode={city.inseeCode}
              postalCode={city.postalCode}
            />

            <div className="city-trust-row">
              {seoPreview ? (
                <>
                  <span><Database size={16} /> {hasCurrentMarketReference ? "Ventes DVF + annonces immobilières locales" : usesDvfMedian ? "Transactions publiées · DVF DGFiP" : "Repères communaux · Immo Data"}</span>
                  <span><CalendarDays size={16} /> Calcul actualisé en {formatMonthYear(marketReferenceUpdatedAt)}</span>
                  {latestObservedSaleDate ? (
                    <span><ShieldCheck size={16} /> Dernières mutations disponibles : {formatDate(latestObservedSaleDate)}</span>
                  ) : null}
                </>
              ) : (
                <>
                  <span><ShieldCheck size={16} /> Données sécurisées</span>
                  <span><CalendarDays size={16} /> Données du {formatDate(market.updatedAt)}</span>
                </>
              )}
            </div>

          </div>

          <div className="city-modern-map-wrap">
            {seoPreview && city.slug === "aubagne" ? (
              <AubagneDvfPreviewMap
                accessToken={mapboxToken}
                communalApartmentPrice={market.apartment.averagePricePerM2}
                communalHousePrice={market.house.averagePricePerM2}
              />
            ) : (
              <CityPriceMap
                accessToken={mapboxToken}
                center={{ longitude: city.longitude, latitude: city.latitude }}
                cityName={city.name}
                fitToSalePoints={seoPreview}
                fitToZones={seoPreview}
                salePoints={market.salePoints}
                showPriceScale
                showZoneLabels={seoPreview}
                zoneListLimit={seoPreview ? 7 : undefined}
                zoneMetricLabel={seoPreview ? "Prix moyen des appartements" : undefined}
                zoneSelectionLabel={seoPreview ? "Quartiers sélectionnés" : undefined}
                zones={market.zones}
              />
            )}
          </div>
        </div>
      </section>

      {hasCurrentMarketReference ? (
        <CityMarketDashboard
          averagePrice={averagePrice}
          averageTrend={averageTrend}
          city={city}
          market={market}
          seoPreview={seoPreview}
          showTrendCard
          sourceLabel={sourceLabel}
        />
      ) : (
        <section className="city-market-overview city-modern-container" aria-labelledby="overview-title">
          <h2 className="city-visually-hidden" id="overview-title">Le marché en un coup d&apos;œil</h2>
          <div className="city-overview-grid">
            <MarketPriceCard centralLabel={usesDvfMedian ? "Médiane" : undefined} icon={Building2} label="Appartement" stat={apartmentOverviewStat} />
            <MarketPriceCard centralLabel={usesDvfMedian ? "Médiane" : undefined} icon={Home} label="Maison" stat={houseOverviewStat} />
            <article className="city-market-signal-card">
              <span>Évolution sur un an</span>
              <strong>{averageTrend !== null ? formatPercent(averageTrend) : "À venir"}</strong>
              <p>{averageTrend === null ? "Historique insuffisant pour publier une tendance" : Math.abs(averageTrend) < 1 ? "Un marché globalement stable" : averageTrend > 0 ? "Une dynamique haussière" : "Un marché en léger ajustement"}</p>
            </article>
          </div>
        </section>
      )}

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
              <strong>{formatPrice(apartmentMarketReference)}<small>/m²</small></strong>
              <p>
                {market.apartment.rangeSource === "transactions" ? "Les transactions observées situent" : "La fourchette indicative situe"} les appartements entre {formatPrice(market.apartment.lowPricePerM2)} et {formatPrice(market.apartment.highPricePerM2)}/m².
                L’étage, l’extérieur, le stationnement et l’état de la copropriété affinent ce repère.
              </p>
            </div>
          </article>
          <article>
            <span><Home size={21} /></span>
            <div>
              <h3>Prix m² maison à {city.name}</h3>
              <strong>{formatPrice(houseMarketReference)}<small>/m²</small></strong>
              <p>
                {market.house.rangeSource === "transactions" ? "Les transactions observées situent" : "La fourchette indicative situe"} les maisons entre {formatPrice(market.house.lowPricePerM2)} et {formatPrice(market.house.highPricePerM2)}/m².
                La parcelle, la vue, les annexes et les travaux rendent la comparaison plus sélective.
              </p>
            </div>
          </article>
        </div>
      </section>

      {seoPreview && previewNeighborhoods.length > 0 ? (
        <section className={`city-modern-container ${previewStyles.neighborhoodSection}`} aria-labelledby="price-neighborhood-title">
          <div className={previewStyles.neighborhoodHeading}>
            <div>
              <p className="city-section-kicker">Quartiers de {city.name}</p>
              <h2 id="price-neighborhood-title">
                {city.slug === "aubagne"
                  ? "Une tendance de marché, des réalités différentes selon les quartiers d’Aubagne"
                  : `À ${city.name}, le quartier compte autant que la moyenne`}
              </h2>
            </div>
            {city.slug === "aubagne" && averageTrend !== null ? (
              <p>
                Sur un an, le marché aubagnais évolue de <strong>{formatPercent(averageTrend)}</strong>,
                avec <strong>{formatPercent(market.apartment.trend1Year)}</strong> pour les appartements et
                {" "}<strong>{formatPercent(market.house.trend1Year)}</strong> pour les maisons. Cette tendance
                communale n&apos;est pas uniforme : la rareté de l&apos;offre, la parcelle, la vue, l&apos;état
                et l&apos;adresse créent des écarts importants entre les quartiers présentés ci-dessous.
              </p>
            ) : (
              <p>
                Le prix communal donne un ordre de grandeur. Pour comparer deux maisons,
                il faut ensuite regarder le quartier, la rue, le terrain, l’exposition,
                les accès et les prestations réelles du bien.
              </p>
            )}
          </div>

          <div className={previewStyles.neighborhoodGrid}>
            {previewNeighborhoods.map((neighborhood, index) => (
              <article key={neighborhood.title}>
                <span>{index === 0 ? "Maisons et vues" : index === 1 ? "Secteur résidentiel" : index === 2 ? "Parcelles et calme" : "Repère local"}</span>
                <h3>{neighborhood.title}</h3>
                <p>{neighborhood.description}</p>
              </article>
            ))}
          </div>

          {city.slug === "aubagne" ? (
            <section className={previewStyles.irisComparison} aria-labelledby="aubagne-iris-comparison-title">
              <div className={previewStyles.irisComparisonHeading}>
                <div>
                  <span>20 zones IRIS officielles</span>
                  <h3 id="aubagne-iris-comparison-title">Comparer les prix par quartier à Aubagne</h3>
                </div>
                <p>
                  Médianes des ventes comparables DVF 2021–2025 dès trois ventes. En dessous,
                  le repère communal est clairement distingué. Appartements et maisons restent séparés.
                </p>
              </div>

              <div className={previewStyles.irisComparisonGrid}>
                {aubagneDvfPreviewZones.map((zone) => (
                  <article key={`${zone.code}-comparison`}>
                    <div className={previewStyles.irisZoneTitle}>
                      <h4>{zone.name}</h4>
                      <small>IRIS {zone.code.slice(-3)}</small>
                    </div>
                    <dl>
                      <div data-reliability={zone.apartment.reliability}>
                        <dt><Building2 size={14} /> Appartement</dt>
                        <dd>
                          {zone.apartment.medianPricePerM2 !== null
                            ? <>{formatPrice(zone.apartment.medianPricePerM2)}<small>/m²</small></>
                            : <span>Repère Aubagne : {formatPrice(market.apartment.averagePricePerM2)}/m²</span>}
                        </dd>
                        <small>{formatIrisObservationLabel(zone.apartment)}</small>
                      </div>
                      <div data-reliability={zone.house.reliability}>
                        <dt><Home size={14} /> Maison</dt>
                        <dd>
                          {zone.house.medianPricePerM2 !== null
                            ? <>{formatPrice(zone.house.medianPricePerM2)}<small>/m²</small></>
                            : <span>Repère Aubagne : {formatPrice(market.house.averagePricePerM2)}/m²</span>}
                        </dd>
                        <small>{formatIrisObservationLabel(zone.house)}</small>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <aside className={previewStyles.dataGuardrail}>
            <div>
              <strong>Pourquoi aucun prix artificiel par quartier ?</strong>
              <p>
                Un prix local n’est publié que lorsque le nombre de mutations exploitables
                permet de séparer maisons et appartements. À défaut, nous préférons montrer
                les ventes disponibles et expliquer les facteurs qui font varier la valeur.
              </p>
            </div>
            <Link href={`/estimation-immobiliere/${city.slug}`}>
              Estimer une adresse à {city.name}<ArrowRight size={16} />
            </Link>
          </aside>

          <p className={previewStyles.sourceNote}>
            Sources : données DVF publiées par la DGFiP, zonage IRIS de l’INSEE et documents
            locaux disponibles. Les noms de quartiers servent à contextualiser les prix ; ils
            ne remplacent pas l’analyse d’une adresse et de biens comparables.
          </p>
        </section>
      ) : null}

      {!hasCurrentMarketReference ? (
        <CityMarketDashboard
          averagePrice={averagePrice}
          averageTrend={averageTrend}
          city={city}
          market={market}
          seoPreview={seoPreview}
          showTrendCard={false}
          sourceLabel={sourceLabel}
        />
      ) : null}

      <section className="city-local-modern city-modern-container">
        {market.localInfo ? <article>
          <p className="city-section-kicker">Cadre de vie</p><h2>{city.name} en quelques repères</h2>
          <dl>
            <div><dt>Population</dt><dd>{euroFormatter.format(market.localInfo.population)} habitants</dd></div>
            <div><dt>Densité</dt><dd>{euroFormatter.format(market.localInfo.density)} hab./km²</dd></div>
            <div><dt>Surface</dt><dd>{decimalFormatter.format(market.localInfo.areaKm2)} km²</dd></div>
            {market.localInfo.ownerShare ? <div><dt>Propriétaires</dt><dd>{decimalFormatter.format(market.localInfo.ownerShare)} %</dd></div> : null}
          </dl>
          {market.localInfo.source ? <small>Source : {market.localInfo.source}{market.localInfo.vintage ? ` · recensement ${market.localInfo.vintage}` : ""}</small> : null}
        </article> : null}
        <article>
          <p className="city-section-kicker">Comparer</p><h2>Les villes voisines</h2>
          <div className="nearby-city-list">
            {nearbyCities.map((nearbyCity) => {
              const nearby = marketSnapshots.get(nearbyCity.inseeCode);
              const previewNearby = seoPreview
                ? getAubagneNearbyPreviewPrice(nearbyCity.slug)
                : null;
              const price = nearby
                ? getAverageMarketPrice(nearby.apartment.averagePricePerM2, nearby.house.averagePricePerM2)
                : null;
              return (
                <Link href={`/prix-m2/${nearbyCity.slug}`} key={nearbyCity.slug} title={`Prix m² à ${nearbyCity.name}`}>
                  <span>Prix m² à {nearbyCity.name}</span>
                  <strong>
                    {seoPreview && (nearby || previewNearby)
                      ? `App. ${formatPrice(nearby?.apartment.averagePricePerM2 ?? previewNearby!.apartment)} · Maison ${formatPrice(nearby?.house.averagePricePerM2 ?? previewNearby!.house)}`
                      : price !== null ? `${formatPrice(price)}/m²` : "Donnée à venir"}
                  </strong>
                  <ArrowRight size={15} />
                </Link>
              );
            })}
          </div>
        </article>
      </section>

      <section className="city-dvf-method city-modern-container" aria-labelledby="dvf-method-title">
        <div className="city-dvf-method-copy">
          <p className="city-section-kicker">Méthode et source</p>
          <h2 id="dvf-method-title">Comment connaître le prix au m² à {city.name} ?</h2>
          <p>
            {seoPreview
              ? `Les repères affichés séparent les appartements et les maisons. Ils s’appuient sur les transactions immobilières publiées dans la base DVF, complétées par un historique de marché et les caractéristiques connues des biens.`
              : `Nos repères s’appuient sur les transactions immobilières enregistrées dans la base publique DVF. Elles donnent une lecture factuelle des ventes signées, puis sont regroupées par type de bien et par secteur pour calculer un prix au m² cohérent.`}
          </p>
          <p>
            {seoPreview
              ? `La date de calcul et la dernière mutation disponible sont présentées séparément afin de tenir compte du délai de publication des données publiques. Les ventes atypiques ou incomplètes doivent rester exclues des comparaisons.`
              : `Cette donnée constitue un point de départ. Deux logements de même surface peuvent avoir des valeurs différentes selon leur adresse, leur état, leur exposition, leur performance énergétique ou la présence d’un extérieur.`}
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
          <h2 id="city-project-title">Passer du {usesDvfMedian ? "prix médian" : "prix moyen"} à votre bien</h2>
          <p>Utilisez les données du marché pour cadrer votre projet, puis obtenez une analyse adaptée à votre adresse.</p>
          {seoPreview && city.slug === "aubagne" ? (
            <Link className={previewStyles.projectEstimateCta} href={`/estimation-immobiliere/${city.slug}`}>
              Demander mon estimation <ArrowRight size={16} />
            </Link>
          ) : null}
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
        <h2>{seoPreview ? `À ${city.name}, une médiane communale ne suffit pas à estimer votre bien.` : `La moyenne de ${city.name} ne suffit pas à estimer votre bien.`}</h2>
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
