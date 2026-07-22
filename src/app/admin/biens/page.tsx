import Image from "next/image";
import Link from "next/link";
import { Archive, BarChart3, Building2, ExternalLink, Home, Images, Pencil, Plus } from "lucide-react";
import { requireAdminSession } from "@/lib/admin/auth";
import { getAdminProperties } from "@/lib/properties";
import { getPropertyMarketScores } from "@/lib/property-market-score";
import admin from "../admin.module.css";
import styles from "../properties.module.css";
import { DeletePropertyButton } from "./DeletePropertyButton";
import { PropertyOrderManager, type OrderedProperty } from "./PropertyOrderManager";

export const dynamic = "force-dynamic";

export default async function PropertiesAdminPage() {
  await requireAdminSession();
  let properties: Awaited<ReturnType<typeof getAdminProperties>> = [];
  let error = "";
  try { properties = await getAdminProperties(); } catch (cause) { error = cause instanceof Error ? cause.message : "Lecture impossible"; }
  const published = properties.filter(property => property.status === "published").length;
  const sold = properties.filter(property => property.status === "sold").length;
  const drafts = properties.filter(property => property.status === "draft").length;
  const marketScores = await getPropertyMarketScores(properties);
  const scoredProperties = [...marketScores.values()].filter((score) => score !== null);
  const coherentProperties = scoredProperties.filter((score) => score?.status === "coherent").length;
  const publicProperties: OrderedProperty[] = properties
    .filter((property): property is typeof property & { status: "published" | "sold" } => ["published", "sold"].includes(property.status))
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "sold" ? 1 : -1;
      return a.display_order - b.display_order || new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime();
    })
    .map((property) => ({
      cityName: property.city_name,
      id: property.id,
      imageUrl: property.images[0]?.public_url || null,
      status: property.status,
      title: property.title,
    }));

  return <main className={admin.adminPage}>
    <aside className={admin.sidebar}><div className={admin.brandMark}><span>les jumelles</span><strong>IMMO</strong></div><nav><Link data-active href="/admin/biens">Biens</Link><Link href="/admin/recherches">Recherches</Link><Link href="/admin/estimations">Estimations</Link><Link href="/admin/clients">Clients</Link><Link href="/admin/recherches-villes">Villes recherchées</Link><Link href="/admin/contenus">Contenus</Link><Link href="/admin/utilisateurs">Utilisateurs</Link></nav></aside>
    <section className={`${admin.content} ${styles.catalogContent}`}>
      <header className={admin.pageHeader}><div><p className={admin.eyebrow}>Catalogue immobilier</p><h1>Vos biens</h1><p>Gérez vos annonces, leur publication et leur visibilité depuis un seul espace.</p></div><Link className={styles.addButton} href="/admin/biens/nouveau"><Plus size={18}/> Ajouter un bien</Link></header>
      <div className={styles.catalogStats}><article><Building2/><span>Total</span><strong>{properties.length}</strong></article><article><span className={styles.liveDot}/><span>En vente</span><strong>{published}</strong></article><article><span className={styles.soldDot}/><span>Vendus</span><strong>{sold}</strong></article><article><Archive/><span>Brouillons</span><strong>{drafts}</strong></article><article><span className={styles.scoreDot}/><span>Prix cohérents</span><strong>{coherentProperties}/{scoredProperties.length}</strong></article></div>
      {!error && publicProperties.length ? <PropertyOrderManager properties={publicProperties}/> : null}
      <div className={styles.catalogHeading}><div><h2>Liste des biens</h2><p>{properties.length} annonce{properties.length > 1 ? "s" : ""} dans votre catalogue</p></div></div>
      {error ? <p className={styles.catalogError}>{error}</p> : properties.length === 0 ? <section className={styles.emptyCatalog}><Home/><h2>Aucun bien pour le moment</h2><p>Ajoutez votre première annonce pour commencer.</p><Link className={styles.addButton} href="/admin/biens/nouveau"><Plus size={18}/> Ajouter un bien</Link></section> : <div className={styles.list}>{properties.map(property => { const marketScore = marketScores.get(property.id); return <article key={property.id}>
        <div className={styles.cover}>{property.images[0] ? <Image src={property.images[0].public_url} alt="" height={112} width={160}/> : <Home/>}</div>
        <div className={styles.propertyInfo}><div><span className={styles.status} data-status={property.status}>{property.status === "published" ? "En vente" : property.status === "sold" ? "Vendu" : property.status === "draft" ? "Brouillon" : "Archivé"}</span><span className={styles.propertyType}>{property.property_type === "house" ? "Maison" : property.property_type === "land" ? "Terrain" : "Appartement"}</span></div><h2>{property.title}</h2><p>{property.city_name}{property.postal_code ? ` (${property.postal_code})` : ""}</p><div className={styles.propertyMetrics}><strong>{new Intl.NumberFormat("fr-FR").format(property.price)} €</strong>{property.surface_m2 ? <span>{property.surface_m2} m²</span> : null}{property.rooms ? <span>{property.rooms} pièces</span> : null}<span><Images size={14}/> {property.images.length} photo{property.images.length > 1 ? "s" : ""}</span></div>{marketScore ? <div className={styles.marketScore} data-position={marketScore.marketPosition}><strong className={styles.marketPositionLabel}><i/>{marketScore.label}</strong><small>{new Intl.NumberFormat("fr-FR").format(marketScore.listingPricePerM2)} €/m² affiché · fourchette {new Intl.NumberFormat("fr-FR").format(marketScore.rangeLowPerM2)}–{new Intl.NumberFormat("fr-FR").format(marketScore.rangeHighPerM2)} €/m²</small></div> : <div className={styles.marketScoreEmpty}>Analyse indisponible — données ville ou surface manquantes</div>}</div>
        <div className={styles.rowActions}><Link href={`/admin/biens/${property.id}`}><Pencil size={17}/> Modifier</Link><DeletePropertyButton propertyId={property.id} propertyTitle={property.title}/><Link href={`/admin/biens/${property.id}/statistiques`}><BarChart3 size={17}/> Statistiques</Link><Link href={`/biens/${property.slug}${["published", "sold"].includes(property.status) ? "" : "?apercu=1"}`} target="_blank"><ExternalLink size={17}/> {["published", "sold"].includes(property.status) ? "Voir" : "Aperçu"}</Link><a href={`/admin/api/properties/${property.id}/pdf`} target="_blank"><Image alt="" aria-hidden="true" height={18} src="/icons/pdf.svg" width={18}/> PDF</a></div>
      </article>})}</div>}
    </section>
  </main>;
}
