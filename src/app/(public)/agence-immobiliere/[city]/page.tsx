import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  Eye,
  FileSearch,
  Handshake,
  Home,
  MapPin,
  ParkingCircle,
  Ruler,
  SearchCheck,
  Sofa,
  Sparkles,
  Trees,
} from "lucide-react";
import { ContentImage } from "@/components/content/ContentImage";
import { getCityBySlug } from "@/lib/cities";
import { readCityMarketCache } from "@/lib/city-market-cache";
import { getStaticCityMarketData } from "@/lib/city-market-data";
import { getPublishedContentArticles } from "@/lib/content/articles";
import {
  getLocalAgencyPage,
  getLocalAgencyPageSlugs,
  getNearestLocalAgencyCities,
} from "@/lib/local-agency-pages";
import { createPageMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";
import { CityMarketChart } from "../../prix-immobilier/[city]/city-market-chart";
import { LocalAgencyLeadForm } from "./LocalAgencyLeadForm";
import { LocalAgencyQuickActions } from "./LocalAgencyQuickActions";
import { LocalAgencySalesMap } from "./LocalAgencySalesMap";
import styles from "./local-agency.module.css";

type LocalAgencyPageProps = {
  params: Promise<{ city: string }>;
};

const euroFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

function formatPrice(value: number) {
  return `${euroFormatter.format(value)} €`;
}

function formatTrend(value: number) {
  return `${value > 0 ? "+" : ""}${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
}

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return getLocalAgencyPageSlugs().map((city) => ({ city }));
}

export async function generateMetadata({ params }: LocalAgencyPageProps): Promise<Metadata> {
  const { city: citySlug } = await params;
  const config = getLocalAgencyPage(citySlug);
  const city = getCityBySlug(citySlug);

  if (!config || !city) return {};

  return createPageMetadata({
    title: `Agence immobilière à ${city.name} | Estimation et vente`,
    description: `Les Jumelles Immo vous accompagnent à ${city.name} pour estimer, valoriser et vendre votre maison ou appartement avec une stratégie adaptée au marché local.`,
    image: config.heroImage.src,
    path: `/agence-immobiliere/${city.slug}`,
  });
}

export default async function LocalAgencyCityPage({ params }: LocalAgencyPageProps) {
  const { city: citySlug } = await params;
  const config = getLocalAgencyPage(citySlug);
  const city = getCityBySlug(citySlug);

  if (!config || !city) notFound();

  const [cachedMarket, articles] = await Promise.all([
    readCityMarketCache(city),
    getPublishedContentArticles(12).catch(() => []),
  ]);
  const market = cachedMarket?.data ?? getStaticCityMarketData(city);
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";
  const nearestAgencyCities = getNearestLocalAgencyCities(city.slug);
  const nearestAgencySlugs = new Set(nearestAgencyCities.map((nearbyCity) => nearbyCity.slug));
  const placeholderCities = config.nearbySlugs.flatMap((slug) => {
    const nearbyCity = getCityBySlug(slug);
    return nearbyCity && !nearestAgencySlugs.has(nearbyCity.slug) ? [nearbyCity] : [];
  });
  const nearbyAgencySlots = [
    ...nearestAgencyCities.map((nearbyCity) => ({ city: nearbyCity, published: true })),
    ...placeholderCities.map((nearbyCity) => ({ city: nearbyCity, published: false })),
  ].slice(0, 4);
  const relatedArticle =
    articles.find((article) => article.related_city_slug === city.slug) ?? articles[0] ?? null;
  const averagePrice = Math.round(
    (market.apartment.averagePricePerM2 + market.house.averagePricePerM2) / 2,
  );
  const averageTrend = Number(
    ((market.apartment.trend1Year + market.house.trend1Year) / 2).toFixed(1),
  );
  const pagePath = `/agence-immobiliere/${city.slug}`;
  const faqJsonLd = {
    "@type": "FAQPage",
    mainEntity: config.faqs.map((faq) => ({
      "@type": "Question",
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
      name: faq.question,
    })),
  };
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", item: absoluteUrl("/"), name: "Accueil", position: 1 },
          { "@type": "ListItem", item: absoluteUrl(pagePath), name: `Agence immobilière à ${city.name}`, position: 2 },
        ],
      },
      {
        "@type": "Service",
        areaServed: {
          "@type": "City",
          address: { "@type": "PostalAddress", postalCode: city.postalCode },
          name: city.name,
        },
        description: config.heroIntro,
        name: `Accompagnement immobilier à ${city.name}`,
        provider: { "@id": `${absoluteUrl("/")}#organization` },
        serviceType: "Estimation, valorisation et vente immobilière",
        url: absoluteUrl(pagePath),
      },
      faqJsonLd,
    ],
  };

  const propertyCards = [
    {
      alt: "Maison contemporaine avec jardin",
      description: "Lire le terrain, les volumes et le potentiel.",
      src: "/images/local-agency/maison-contemporaine-jardin.jpg",
      title: "Maison avec jardin",
    },
    {
      alt: "Séjour lumineux d’un appartement",
      description: "Valoriser la lumière, la distribution et les extérieurs.",
      src: "/images/local-agency/appartement-lumineux.webp",
      title: "Appartement",
    },
    {
      alt: "Intérieur lumineux aménagé pour faciliter la projection",
      description: "Aider les acquéreurs à se projeter sans fausse promesse.",
      src: "/images/local-agency/interieur-maison-lumineux.jpg",
      title: "Bien à révéler",
    },
  ];

  const factorIcons = [MapPin, Eye, Trees, ParkingCircle, Sofa, Ruler];

  return (
    <main className={styles.page}>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        type="application/ld+json"
      />

      <section className={styles.hero} aria-labelledby="local-agency-title">
        <div className={styles.heroCopy}>
          <nav className={styles.breadcrumb} aria-label="Fil d’Ariane">
            <Link href="/">Accueil</Link><span>/</span><span>{city.name}</span>
          </nav>
          <p className={styles.eyebrow}>{config.eyebrow}</p>
          <h1 id="local-agency-title">Agence immobilière à {city.name}</h1>
          <h2 className={styles.heroHeadline}>{config.heroTitle}</h2>
          <p className={styles.heroIntro}>
            Vous souhaitez vendre une maison ou un appartement à {city.name} ? Nous
            estimons votre bien, préparons sa commercialisation et vous accompagnons
            dans les visites, la négociation et le suivi de la vente jusqu’à la signature.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryButton} href="/estimation">
              Estimer et vendre mon bien <ArrowRight size={17} />
            </Link>
            <a className={styles.textLink} href="#parlons-de-votre-bien">
              Échanger sur mon projet <ArrowRight size={15} />
            </a>
          </div>
          <div className={styles.heroProofs} aria-label="Nos engagements">
            <span><MapPin /><small>Visite sur place</small></span>
            <span><ClipboardCheck /><small>Estimation argumentée</small></span>
            <span><Handshake /><small>Suivi coordonné du projet</small></span>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <Image
            alt={config.heroImage.alt}
            className={styles.heroImage}
            fill
            priority
            quality={78}
            sizes="(max-width: 760px) 100vw, (max-width: 1100px) 46vw, 44vw"
            src={config.heroImage.src}
          />
          <span className={styles.heroLabel}>Maison avec extérieur</span>
        </div>
      </section>

      <div className={styles.coverageStrip}>
        <MapPin aria-hidden="true" size={18} />
        <p>{config.interventionText}</p>
      </div>

      <section className={styles.strategySection} id="parlons-de-votre-bien">
        <div className={styles.strategyCopy}>
          <p className={styles.eyebrow}>Vendre à {city.name}</p>
          <h2>Le bon prix attire. La bonne stratégie fait vendre.</h2>
          <p>
            Vue, lumière, extérieur, stationnement, état ou potentiel : nous analysons ce
            qui rend votre bien différent pour fixer un prix cohérent, soigner sa
            présentation et attirer des acquéreurs réellement qualifiés.
          </p>
          <LocalAgencyQuickActions cityName={city.name} />
        </div>
        <aside className={styles.leadCard} aria-labelledby="lead-form-title">
          <p className={styles.eyebrow}>Premier échange</p>
          <h2 id="lead-form-title">Parlons de votre bien</h2>
          <LocalAgencyLeadForm cityName={city.name} />
        </aside>
      </section>

      <section className={styles.teamSection} aria-labelledby="team-title">
        <div className={styles.teamPortrait}>
          <Image
            alt="Laure et Séverine, fondatrices des Jumelles Immo"
            fill
            sizes="(max-width: 760px) 100vw, 40vw"
            src="/images/laure-severine-jumelles-immo.jpg"
          />
        </div>
        <div className={styles.teamCopy}>
          <p className={styles.eyebrow}>Les Jumelles Immo</p>
          <h2 id="team-title">Deux sœurs, trois expertises pour vendre votre bien avec justesse.</h2>
          <div className={styles.expertiseGrid}>
            <article><Home /><h3>Transaction et stratégie de vente</h3><p>Estimer, commercialiser, négocier et accompagner la vente jusqu’à la signature.</p></article>
            <article><FileSearch /><h3>Urbanisme et potentiel</h3><p>Identifier le potentiel réglementaire et les leviers de valorisation.</p></article>
            <article><Sofa /><h3>Architecture intérieure et travaux</h3><p>Révéler les volumes et faciliter la projection des futurs acquéreurs.</p></article>
          </div>
          <Link className={styles.textLink} href="/qui-sommes-nous">Découvrir notre approche <ArrowRight size={15} /></Link>
        </div>
      </section>

      <section className={styles.processSection} aria-labelledby="process-title">
        <div className={styles.processHeader}>
          <div>
            <p className={styles.eyebrow}>Notre accompagnement de transaction</p>
            <h2 id="process-title">De l’estimation à la signature, chaque étape est pilotée.</h2>
          </div>
          <p>
            Un interlocuteur référent coordonne votre vente, sélectionne les acquéreurs
            et vous tient informé avec des points de suivi clairs.
          </p>
        </div>
        <div className={styles.processGrid}>
          <article><div><b>01</b><SearchCheck /></div><h3>Découverte du bien</h3><p>Visite sur place, écoute de votre projet et analyse des caractéristiques qui influencent sa valeur.</p></article>
          <article><div><b>02</b><ClipboardCheck /></div><h3>Estimation et stratégie</h3><p>Prix argumenté, positionnement et plan de commercialisation adapté au marché local.</p></article>
          <article><div><b>03</b><Sparkles /></div><h3>Mise en valeur et diffusion</h3><p>Conseils, photos, annonce, diffusion ciblée et sélection des acquéreurs avant les visites.</p></article>
          <article><div><b>04</b><Handshake /></div><h3>Visites, négociation et signature</h3><p>Retours qualifiés, analyse des offres et coordination du compromis jusqu’à la signature définitive.</p></article>
        </div>
      </section>

      <section className={styles.propertySection} aria-labelledby="property-types-title">
        <div className={styles.centerHeading}>
          <p className={styles.eyebrow}>Une présentation sur mesure</p>
          <h2 id="property-types-title">Des biens différents, une même exigence.</h2>
        </div>
        <div className={styles.propertyGrid}>
          {propertyCards.map((card) => (
            <article className={styles.propertyCard} key={card.title}>
              <div className={styles.propertyImage}>
                <Image alt={card.alt} fill sizes="(max-width: 720px) 100vw, 33vw" src={card.src} />
              </div>
              <div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <ArrowRight aria-hidden="true" size={18} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.marketSection} aria-label={`Repères immobiliers à ${city.name}`}>
        <article className={styles.chartCard}>
          <div className={styles.sectionHeadingRow}>
            <div><p className={styles.eyebrow}>Repères locaux</p><h2>Le marché immobilier à {city.name}</h2></div>
            <Link href={`/prix-m2/${city.slug}`}>Analyse complète <ArrowRight size={15} /></Link>
          </div>
          <div className={styles.marketMetrics}>
            <span><Building2 /><small>Appartement</small><strong>{formatPrice(market.apartment.averagePricePerM2)}<b>/m²</b></strong></span>
            <span><Home /><small>Maison</small><strong>{formatPrice(market.house.averagePricePerM2)}<b>/m²</b></strong></span>
            <span><Sparkles /><small>Tendance annuelle</small><strong>{formatTrend(averageTrend)}</strong></span>
          </div>
          <CityMarketChart averagePrice={averagePrice} cityName={city.name} defaultPeriod="5y" points={market.history} />
          <p className={styles.marketNote}>Ces moyennes donnent un repère. Elles ne remplacent jamais la visite et l’analyse des caractéristiques propres au bien.</p>
        </article>

        <article className={styles.factorsCard}>
          <p className={styles.eyebrow}>Estimer au-delà de la moyenne</p>
          <h2>Ce qui fait réellement varier la valeur ici</h2>
          <LocalAgencySalesMap
            accessToken={mapboxToken}
            center={{ latitude: city.latitude, longitude: city.longitude }}
            cityName={city.name}
            salePoints={market.salePoints}
          />
          <div className={styles.factorList}>
            {config.localFactors.map((factor, index) => {
              const Icon = factorIcons[index];
              return (
                <div key={factor.title}>
                  <Icon aria-hidden="true" />
                  <span><strong>{factor.title}</strong><small>{factor.description}</small></span>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className={styles.resourceSection}>
        <article className={styles.priceResource}>
          <p className={styles.eyebrow}>Observatoire local</p>
          <h2>Prix au m² à {city.name}</h2>
          <div>
            <span>
              <Building2 aria-hidden="true" />
              <small>Appartement</small>
              <strong>{formatPrice(market.apartment.averagePricePerM2)}/m²</strong>
            </span>
            <span>
              <Home aria-hidden="true" />
              <small>Maison</small>
              <strong>{formatPrice(market.house.averagePricePerM2)}/m²</strong>
            </span>
          </div>
          <Link href={`/prix-m2/${city.slug}`}>Voir les prix <ArrowRight size={15} /></Link>
        </article>
        <article className={styles.adviceResource}>
          <div>
            <p className={styles.eyebrow}>Conseils pour vendre à {city.name}</p>
            <h2>{relatedArticle?.title || "Préparer son bien, choisir le bon moment et comprendre les attentes locales."}</h2>
            <p>{relatedArticle?.excerpt || "Nos conseils concrets pour vendre sereinement et dans les meilleures conditions."}</p>
            <Link href={relatedArticle ? `/contenus/${relatedArticle.slug}` : "/contenus"}>Lire nos conseils <ArrowRight size={15} /></Link>
          </div>
          {relatedArticle?.cover_image_url ? (
            <div className={styles.adviceImage}><ContentImage alt={relatedArticle.cover_image_alt || relatedArticle.title} fill sizes="260px" src={relatedArticle.cover_image_url} /></div>
          ) : <Sparkles aria-hidden="true" />}
        </article>
      </section>

      <section className={styles.faqSection} aria-labelledby="faq-title">
        <p className={styles.eyebrow}>Questions fréquentes</p>
        <h2 id="faq-title">Votre projet immobilier à {city.name}</h2>
        <p className={styles.faqIntro}>
          Estimation, prix de vente, valorisation ou préparation du dossier : retrouvez les
          réponses aux principales questions avant de vendre une maison ou un appartement à {city.name}.
        </p>
        <div className={styles.faqList}>
          {config.faqs.map((faq) => (
            <details key={faq.question}>
              <summary>{faq.question}<span aria-hidden="true">+</span></summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={styles.nearbySection} aria-labelledby="nearby-title">
        <div className={styles.sectionHeadingRow}>
          <div><p className={styles.eyebrow}>Nos secteurs d’intervention</p><h2 id="nearby-title">Les Jumelles Immo autour de {city.name}</h2></div>
        </div>
        <div className={styles.nearbyGrid}>
          {nearbyAgencySlots.map(({ city: nearbyCity, published }) =>
            published ? (
              <Link
                href={`/agence-immobiliere/${nearbyCity.slug}`}
                key={nearbyCity.slug}
                title={`Agence immobilière à ${nearbyCity.name}`}
              >
                <small>Agence immobilière</small>
                <strong>{nearbyCity.name}</strong>
                <span>Découvrir l’agence <ArrowRight size={14} /></span>
              </Link>
            ) : (
              <article className={styles.nearbyPlaceholder} key={nearbyCity.slug}>
                <small>Agence immobilière</small>
                <strong>{nearbyCity.name}</strong>
                <span>Secteur couvert</span>
              </article>
            ),
          )}
        </div>
      </section>

      <section className={styles.finalCta} aria-labelledby="final-cta-title">
        <div>
          <p className={styles.eyebrow}>Votre bien mérite une vraie stratégie</p>
          <h2 id="final-cta-title">Révéler ses atouts. Défendre son prix. Sécuriser sa vente.</h2>
          <p>
            À {city.name}, nous préparons chaque bien pour convaincre les bons acquéreurs
            et coordonnons chaque étape de la commercialisation jusqu’à la signature.
          </p>
          <Link href="/estimation">Découvrir la valeur de mon bien <ArrowRight size={16} /></Link>
        </div>
        <div className={styles.finalImage}>
          <Image
            alt="Maison contemporaine avec jardin"
            fill
            sizes="(max-width: 760px) 100vw, 42vw"
            src="/images/local-agency/maison-contemporaine-jardin.jpg"
          />
        </div>
      </section>

    </main>
  );
}
