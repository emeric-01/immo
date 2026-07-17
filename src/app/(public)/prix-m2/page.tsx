import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, MapPin } from "lucide-react";
import { southCities } from "@/lib/cities";
import { readCityMarketTrends } from "@/lib/city-market-cache";
import { getStaticCityMarketData } from "@/lib/city-market-data";
import { getStoredCityMarketTrend } from "@/lib/stored-city-market-trends";
import { CityDirectory, type DirectoryCity } from "./city-directory";
import { CityHeroSearch } from "./city-hero-search";
import styles from "./prix-m2.module.css";

export const metadata: Metadata = {
  title: "Prix au m² par ville dans le 13 et le 83 | Les Jumelles Immo",
  description:
    "Consultez les prix au m² par ville dans les Bouches-du-Rhône (13) et le Var (83) : appartements, maisons et tendances du marché immobilier local.",
  alternates: {
    canonical: "/prix-m2",
  },
};

async function getDirectoryCities(): Promise<DirectoryCity[]> {
  const cities = southCities.filter(
    (city) => city.department === "Bouches-du-Rhone" || city.department === "Var",
  );
  const cachedTrends = await readCityMarketTrends(cities);

  return cities.map((city) => {
    const market = getStaticCityMarketData(city);
    const averagePrice = Math.round(
      (market.apartment.averagePricePerM2 + market.house.averagePricePerM2) / 2,
    );
    const trend = cachedTrends.get(city.inseeCode) ?? getStoredCityMarketTrend(city);

    return {
      averagePrice,
      departmentCode: city.department === "Var" ? ("83" as const) : ("13" as const),
      housePrice: market.house.averagePricePerM2,
      apartmentPrice: market.apartment.averagePricePerM2,
      name: city.name,
      postalCode: city.postalCode,
      slug: city.slug,
      trend,
    };
  }).sort((cityA, cityB) => cityA.name.localeCompare(cityB.name, "fr"));
}

export default async function PriceDirectoryPage() {
  const directoryCities = await getDirectoryCities();
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Prix au m² par ville dans les Bouches-du-Rhône et le Var",
    numberOfItems: directoryCities.length,
    itemListElement: directoryCities.map((city, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: `Prix au m² à ${city.name}`,
      url: `https://immo-rho.vercel.app/prix-m2/${city.slug}`,
    })),
  };

  return (
    <main className={styles.page}>
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListJsonLd).replace(/</g, "\\u003c"),
        }}
        type="application/ld+json"
      />

      <nav className={styles.breadcrumb} aria-label="Fil d’Ariane">
        <Link href="/">Accueil</Link>
        <span aria-hidden="true">/</span>
        <span>Prix au m² par ville</span>
      </nav>

      <section className={styles.hero} aria-labelledby="directory-title">
        <div className={`${styles.heroParcel} ${styles.heroParcelLeft}`} aria-hidden="true" />
        <div className={`${styles.heroParcel} ${styles.heroParcelRight}`} aria-hidden="true" />
        <div className={styles.heroCopy}>
          <p className={`${styles.eyebrow} ${styles.heroEyebrow}`}>Observatoire immobilier local</p>
          <h1 id="directory-title">Prix au m² par ville dans le 13 et le 83</h1>
          <p>
            Consultez les prix immobiliers, les tendances du marché et les
            repères essentiels dans chaque ville des Bouches-du-Rhône et du Var.
          </p>
          <CityHeroSearch cities={directoryCities} />
          <dl className={styles.heroStats}>
            <div><dd>2</dd><dt>départements</dt></div>
            <div><dd>{directoryCities.length}</dd><dt>villes analysées</dt></div>
          </dl>
        </div>
      </section>

      <section className={styles.directorySection} id="villes" aria-labelledby="cities-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Prix immobilier par commune</p>
            <h2 id="cities-title">Trouvez votre ville</h2>
          </div>
          <p>
            Chaque lien ouvre une analyse locale complète : prix des appartements
            et maisons, historique, ventes récentes et estimation par adresse.
          </p>
        </div>
        <CityDirectory cities={directoryCities} />
      </section>

      <section className={styles.localSeo} aria-labelledby="local-market-title">
        <div className={styles.localSeoHeading}>
          <MapPin aria-hidden="true" />
          <div>
            <p className={styles.eyebrow}>Comprendre le territoire</p>
            <h2 id="local-market-title">Les prix immobiliers dans votre secteur</h2>
          </div>
        </div>
        <div className={styles.localSeoGrid}>
          <article>
            <span>Département 13</span>
            <h3>Le marché dans les Bouches-du-Rhône</h3>
            <p>
              D’Aix-en-Provence à Marseille, d’Aubagne à Cassis, les écarts de
              prix reflètent la proximité du littoral, l’attractivité des
              centres-villes et les caractéristiques propres à chaque quartier.
              Une moyenne départementale ne remplace jamais une lecture locale.
            </p>
            <a href="#villes" title="Prix m² par ville dans les Bouches-du-Rhône">
              Voir les villes du 13 <ArrowRight size={16} />
            </a>
          </article>
          <article>
            <span>Département 83</span>
            <h3>Le marché immobilier dans le Var</h3>
            <p>
              Le Var associe marchés urbains, communes résidentielles et secteurs
              littoraux très recherchés. Les prix au m² varient fortement entre
              Toulon, Hyères, Saint-Cyr-sur-Mer ou Fréjus, mais aussi selon la rue
              et le type de bien.
            </p>
            <a href="#villes" title="Prix m² par ville dans le Var">
              Voir les villes du 83 <ArrowRight size={16} />
            </a>
          </article>
        </div>
      </section>

      <section className={styles.cta} aria-labelledby="directory-cta-title">
        <Building2 aria-hidden="true" />
        <div>
          <p className={styles.eyebrow}>Votre commune n’est pas encore présente ?</p>
          <h2 id="directory-cta-title">Obtenez une estimation adaptée à votre adresse.</h2>
        </div>
        <Link href="/estimation">
          Demander une estimation <ArrowRight size={18} />
        </Link>
      </section>
    </main>
  );
}
