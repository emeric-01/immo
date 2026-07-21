import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BedDouble, Building2, ChevronDown, Home, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { createPageMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";
import { getPublishedProperties, isExclusiveProperty, type Property } from "@/lib/properties";
import styles from "./properties-index.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "Biens immobiliers à vendre | Les Jumelles Immo",
  description: "Découvrez les appartements, maisons et propriétés proposés par Les Jumelles Immo à Aix-en-Provence, Aubagne, Cassis, La Ciotat et leurs environs.",
  path: "/biens",
});

type SearchParams = { q?: string; type?: string; budget?: string; sort?: string };

const money = (value: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
const propertyType = (property: Property) => property.property_type === "house" ? "Maison" : property.property_type === "land" ? "Terrain" : "Appartement";

function PropertyCard({ property, featured = false }: { property: Property; featured?: boolean }) {
  const image = property.images[0];
  const sold = property.status === "sold";
  const exclusive = isExclusiveProperty(property);
  return (
    <Link className={`${styles.card} ${featured ? styles.featured : ""} ${sold ? styles.sold : ""}`} href={`/biens/${property.slug}`}>
      <div className={styles.media}>
        {image ? <Image alt={image.alt_text || property.title} fill priority={featured} sizes={featured ? "(max-width: 760px) 100vw, 66vw" : "(max-width: 760px) 100vw, 33vw"} src={image.public_url}/> : <span className={styles.mediaFallback}><Home/></span>}
        {sold ? <span className={styles.soldBadge}>Vendu par Les Jumelles</span> : exclusive ? <span className={styles.exclusiveBadge}>Exclusivité Les Jumelles</span> : null}
      </div>
      <div className={styles.cardBody}>
        <span className={styles.city}>{property.city_name}{property.neighborhood ? ` · ${property.neighborhood}` : ""}</span>
        <h2>{property.title}</h2>
        <div className={styles.specs}>
          <span>{propertyType(property)}</span>
          {property.surface_m2 ? <span>{property.surface_m2} m²</span> : null}
          {property.rooms ? <span>{property.rooms} pièce{property.rooms > 1 ? "s" : ""}</span> : null}
          {property.bedrooms ? <span><BedDouble/> {property.bedrooms} ch.</span> : null}
        </div>
        <div className={styles.cardFooter}>
          <strong>{sold ? "Vendu" : money(property.price)}</strong>
          <span aria-hidden="true"><ArrowRight/></span>
        </div>
      </div>
    </Link>
  );
}

export default async function PropertiesIndexPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const query = (params.q || "").trim().toLocaleLowerCase("fr-FR");
  const selectedType = params.type || "all";
  const budget = Number(params.budget) || 0;
  const sort = params.sort || "recent";
  const properties = await getPublishedProperties().catch(() => []);

  const filtered = properties.filter((property) => {
    const location = `${property.city_name} ${property.postal_code || ""} ${property.neighborhood || ""}`.toLocaleLowerCase("fr-FR");
    const matchesQuery = !query || location.includes(query);
    const matchesType = selectedType === "all" || property.property_type === selectedType;
    const matchesBudget = !budget || property.price <= budget;
    return matchesQuery && matchesType && matchesBudget;
  }).sort((a, b) => {
    if (a.status !== b.status) return a.status === "sold" ? 1 : -1;
    if (sort === "price-asc") return a.price - b.price;
    if (sort === "price-desc") return b.price - a.price;
    return new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime();
  });

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Biens immobiliers Les Jumelles Immo",
    numberOfItems: filtered.length,
    itemListElement: filtered.map((property, index) => ({ "@type": "ListItem", position: index + 1, name: property.title, url: absoluteUrl(`/biens/${property.slug}`) })),
  };

  const tabs = [
    { value: "all", label: "Tous les biens" },
    { value: "apartment", label: "Appartements" },
    { value: "house", label: "Maisons" },
  ];

  return <main className={styles.page}>
    <script dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd).replace(/</g, "\\u003c") }} type="application/ld+json"/>
    <div className={styles.shell}>
      <header className={styles.hero}>
        <p>Notre sélection</p>
        <h1>Nos biens à vendre</h1>
        <span>Découvrez une sélection de biens choisis avec exigence.</span>
      </header>

      <nav className={styles.tabs} aria-label="Filtrer par type de bien">
        {tabs.map((tab) => <Link aria-current={selectedType === tab.value ? "page" : undefined} href={tab.value === "all" ? "/biens" : `/biens?type=${tab.value}`} key={tab.value}>{tab.label}</Link>)}
      </nav>

      <form className={styles.filters} method="get">
        <label><MapPin/><span className={styles.srOnly}>Ville, quartier ou code postal</span><input defaultValue={params.q} name="q" placeholder="Ville, quartier, code postal"/></label>
        <label><Building2/><span className={styles.srOnly}>Type de bien</span><select defaultValue={selectedType} name="type"><option value="all">Tous les types</option><option value="apartment">Appartement</option><option value="house">Maison</option><option value="land">Terrain</option></select><ChevronDown/></label>
        <label><SlidersHorizontal/><span className={styles.srOnly}>Budget maximal</span><select defaultValue={params.budget || ""} name="budget"><option value="">Budget maximum</option><option value="300000">300 000 €</option><option value="500000">500 000 €</option><option value="750000">750 000 €</option><option value="1000000">1 000 000 €</option><option value="1500000">1 500 000 €</option><option value="2500000">2 500 000 €</option></select><ChevronDown/></label>
        <button type="submit"><Search/> Rechercher</button>
      </form>

      <div className={styles.listHeading}><p>{filtered.length} bien{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}</p><form method="get"><input name="q" type="hidden" value={params.q || ""}/><input name="type" type="hidden" value={selectedType}/><input name="budget" type="hidden" value={params.budget || ""}/><label>Trier par <select defaultValue={sort} name="sort"><option value="recent">Plus récents</option><option value="price-asc">Prix croissant</option><option value="price-desc">Prix décroissant</option></select></label><button type="submit">Appliquer</button></form></div>

      {filtered.length ? <section className={styles.grid} aria-label="Liste des biens">{filtered.map((property, index) => <PropertyCard featured={index === 0} key={property.id} property={property}/>)}</section> : <section className={styles.empty}><Search/><h2>Aucun bien ne correspond à vos critères</h2><p>Élargissez votre recherche ou confiez-nous votre projet pour être informé des prochaines opportunités.</p><div><Link href="/biens">Effacer les filtres</Link><Link href="/recherche">Créer ma recherche</Link></div></section>}
    </div>
    <section className={styles.cta}><div><h2>Vous ne trouvez pas le bien idéal ?</h2><p>Décrivez-nous votre projet et recevez des opportunités vraiment pertinentes.</p></div><Link href="/recherche">Créer ma recherche <ArrowRight/></Link></section>
  </main>;
}
