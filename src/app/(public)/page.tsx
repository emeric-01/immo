import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  FileText,
  Home,
  LockKeyhole,
  Search,
  TrendingDown,
  TrendingUp,
  UserRoundSearch,
} from "lucide-react";
import { getCityBySlug } from "@/lib/cities";
import { getStaticCityMarketData } from "@/lib/city-market-data";
import { getStoredCityMarketTrend } from "@/lib/stored-city-market-trends";
import { HomeAddressSearch } from "./home-address-search";
import styles from "./home.module.css";

export const metadata: Metadata = {
  title: "Les Jumelles Immo | Estimer, vendre et acheter avec méthode",
  description:
    "Prix immobiliers locaux, estimation fiable et recherche accompagnée autour d'Aubagne, Cassis, Gémenos et Aix-en-Provence.",
};

const featuredSlugs = ["aix-en-provence", "aubagne", "gemenos", "cassis", "carnoux-en-provence"];

const cityImages: Record<string, { src: string; alt: string }> = {
  aubagne: {
    src: "/images/cities/aubagne.webp",
    alt: "Vue d’Aubagne et du massif du Garlaban",
  },
  cassis: {
    src: "/images/cities/cassis.webp",
    alt: "Le port de Cassis et ses bateaux traditionnels",
  },
  gemenos: {
    src: "/images/cities/gemenos.webp",
    alt: "L’hôtel de ville de Gémenos",
  },
};

const featuredCities = featuredSlugs.flatMap((slug) => {
  const city = getCityBySlug(slug);
  if (!city) return [];
  const market = getStaticCityMarketData(city);
  const average = Math.round((market.apartment.averagePricePerM2 + market.house.averagePricePerM2) / 2);
  const trend = getStoredCityMarketTrend(city);
  return [{ city, market, average, trend }];
});

const formatPrice = (value: number) => new Intl.NumberFormat("fr-FR").format(value);

export default function HomePage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Les Jumelles Immo</p>
          <h1>L’immobilier, avec <em>méthode et expertise.</em></h1>
          <p className={styles.heroIntro}>
            Données du marché, estimation affinée et recherche accompagnée : une vision claire pour décider sereinement.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryAction} href="/estimation">Estimer mon bien <ArrowRight size={17} /></Link>
            <Link className={styles.secondaryAction} href="/prix-m2">Voir les prix au m²</Link>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.visualFrame}>
            <Image
              alt="Intérieur méditerranéen lumineux représentatif de l’univers Les Jumelles Immo"
              className={styles.heroImage}
              fill
              priority
              quality={82}
              sizes="(max-width: 720px) calc(100vw - 52px), (max-width: 1100px) 42vw, 47vw"
              src="/images/agence-jumelles-immo-hero.webp"
            />
          </div>
        </div>
      </section>

      <section className={styles.services} aria-label="Nos services">
        <article><span className={styles.iconBadge}><BarChart3 /></span><h2>Prix au m²</h2><p>Les prix du marché par ville, secteur et type de bien.</p><Link href="/prix-m2">Explorer les prix <ArrowRight size={16} /></Link></article>
        <article><span className={styles.iconBadge}><Home /></span><h2>Estimation fiable</h2><p>Une estimation data-driven, affinée par l’expertise locale.</p><Link href="/estimation">Estimer mon bien <ArrowRight size={16} /></Link></article>
        <article><span className={styles.iconBadge}><UserRoundSearch /></span><h2>Recherche accompagnée</h2><p>Un projet cadré, des alertes pertinentes et une équipe dédiée.</p><Link href="/recherche">Créer ma recherche <ArrowRight size={16} /></Link></article>
      </section>

      <section className={styles.marketSection} id="secteurs" aria-labelledby="market-title">
        <div className={styles.marketIntro}>
          <p className={styles.eyebrow}>Le marché immobilier</p>
          <h2 id="market-title">Les prix dans votre secteur</h2>
          <p>Des repères locaux, actualisés et directement reliés aux pages détaillées de chaque ville.</p>
          <Link href="/prix-m2">Découvrir l’observatoire <ArrowRight size={16} /></Link>
        </div>
        <div className={styles.cityRail}>
          {featuredCities.map(({ city, market, average, trend }, index) => {
            const TrendIcon = trend !== null && trend >= 0 ? TrendingUp : TrendingDown;
            const cityImage = cityImages[city.slug];
            return (
              <Link className={styles.cityCard} href={`/prix-m2/${city.slug}`} key={city.slug} title={`Prix m² à ${city.name}`}>
                <div className={`${styles.cityVisual} ${styles[`cityVisual${index + 1}`]}`}>
                  {cityImage ? (
                    <Image
                      alt={cityImage.alt}
                      className={styles.cityImage}
                      fill
                      quality={78}
                      sizes="(max-width: 1100px) 210px, 16vw"
                      src={cityImage.src}
                    />
                  ) : (
                    <span>Photo à venir</span>
                  )}
                </div>
                <div className={styles.cityCardBody}>
                  <h3>Prix m² à {city.name}</h3><strong>{formatPrice(average)} €/m²</strong>
                  {trend === null ? (
                    <span className={styles.trendMissing}>Évolution à venir</span>
                  ) : (
                    <span className={trend >= 0 ? styles.trendUp : styles.trendDown}><TrendIcon size={14} /> {trend > 0 ? "+" : ""}{trend.toLocaleString("fr-FR")} % sur 1 an</span>
                  )}
                  <small>{market.transactionCount ? `${market.transactionCount.toLocaleString("fr-FR")} transactions analysées` : "Données de marché disponibles"}</small>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className={styles.estimateBanner} aria-labelledby="estimate-title">
        <div><p className={styles.eyebrow}>Estimation en ligne</p><h2 id="estimate-title">Quelle est la valeur de votre bien ?</h2><p>Gratuit, rapide et sans engagement.</p></div>
        <div className={styles.estimateFormWrap}><HomeAddressSearch compact /><p><LockKeyhole size={14} /> Vos données sont confidentielles et sécurisées.</p></div>
      </section>

      <section className={styles.steps} aria-labelledby="steps-title">
        <p className={styles.eyebrow}>Recherche accompagnée</p><h2 id="steps-title">Votre projet, cadré en 3 étapes</h2>
        <div className={styles.stepGrid}>
          <article><b>1</b><span className={styles.iconBadge}><FileText /></span><div><h3>Définissez votre projet</h3><p>Critères, budget, secteur et contraintes.</p></div></article>
          <article><b>2</b><span className={styles.iconBadge}><Bell /></span><div><h3>Recevez des alertes</h3><p>Des biens sélectionnés selon vos attentes.</p></div></article>
          <article><b>3</b><span className={styles.iconBadge}><UserRoundSearch /></span><div><h3>Avancez avec une équipe</h3><p>Un conseil humain à chaque étape.</p></div></article>
        </div>
      </section>

      <section className={styles.advice} id="conseils" aria-labelledby="advice-title">
        <div className={styles.sectionTitleRow}><div><p className={styles.eyebrow}>Conseils & décryptages</p><h2 id="advice-title">Mieux comprendre pour mieux décider</h2></div><Link href="/estimation">Préparer mon projet <ArrowRight size={16} /></Link></div>
        <div className={styles.adviceGrid}>
          <Link href="/prix-m2/aix-en-provence" title="Prix m² à Aix-en-Provence"><div className={styles.articleVisual}>Marché local</div><div><small>Marché local</small><h3>Prix m² à Aix-en-Provence : comprendre le marché</h3><span>Lire l’analyse <ArrowRight size={14} /></span></div></Link>
          <Link href="/estimation"><div className={styles.articleVisual}>Estimation</div><div><small>Guide pratique</small><h3>Estimer juste : les facteurs qui changent tout</h3><span>Lancer mon estimation <ArrowRight size={14} /></span></div></Link>
          <Link href="/prix-m2/cassis" title="Prix m² à Cassis"><div className={styles.articleVisual}>Cassis</div><div><small>Focus secteur</small><h3>Prix m² à Cassis : les repères essentiels</h3><span>Voir les prix <ArrowRight size={14} /></span></div></Link>
        </div>
      </section>

      <section className={styles.finalCta} aria-labelledby="action-title"><h2 id="action-title">Passez à l’action</h2><div><Link href="/prix-m2"><Building2 /> <span><strong>Connaître les prix</strong><small>Explorer le marché</small></span><ArrowRight /></Link><Link href="/estimation"><Home /> <span><strong>Estimer mon bien</strong><small>Obtenir une estimation</small></span><ArrowRight /></Link><Link href="/recherche"><Search /> <span><strong>Créer ma recherche</strong><small>Être accompagné</small></span><ArrowRight /></Link></div></section>
    </main>
  );
}
