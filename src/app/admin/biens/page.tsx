import Link from "next/link";
import Image from "next/image";
import { ExternalLink, Home, Images } from "lucide-react";
import { requireAdminSession } from "@/lib/admin/auth";
import { getAdminProperties } from "@/lib/properties";
import { PropertyForm } from "./PropertyForm";
import admin from "../admin.module.css";
import styles from "../properties.module.css";

export const dynamic = "force-dynamic";
export default async function PropertiesAdminPage() {
  await requireAdminSession(); let properties = [] as Awaited<ReturnType<typeof getAdminProperties>>; let error = "";
  try { properties = await getAdminProperties(); } catch (cause) { error = cause instanceof Error ? cause.message : "Lecture impossible"; }
  return <main className={admin.adminPage}><aside className={admin.sidebar}><div className={admin.brandMark}><span>les jumelles</span><strong>IMMO</strong></div><nav><Link data-active href="/admin/biens">Biens</Link><Link href="/admin/recherches">Recherches</Link><Link href="/admin/estimations">Estimations</Link><Link href="/admin/clients">Clients</Link><Link href="/admin/recherches-villes">Villes recherchées</Link><Link href="/admin/utilisateurs">Utilisateurs</Link></nav></aside>
  <section className={admin.content}><header className={admin.pageHeader}><div><p className={admin.eyebrow}>Catalogue immobilier</p><h1>Vos biens</h1><p>Créez, prévisualisez et publiez plusieurs fiches depuis un seul espace.</p></div></header>
  {error ? <p>{error}</p> : <div className={styles.list}>{properties.map(property => <article key={property.id}><div className={styles.cover}>{property.images[0] ? <Image src={property.images[0].public_url} alt="" height={84} width={110} /> : <Home />}</div><div><span className={styles.status} data-status={property.status}>{property.status === "published" ? "Publié" : property.status === "draft" ? "Brouillon" : "Archivé"}</span><h2>{property.title}</h2><p>{property.city_name} · {property.surface_m2 ?? "—"} m² · {new Intl.NumberFormat("fr-FR").format(property.price)} €</p><small><Images size={14} /> {property.images.length} photo{property.images.length > 1 ? "s" : ""}</small></div><Link href={`/biens/${property.slug}`} target="_blank"><ExternalLink size={17} /> Voir</Link></article>)}</div>}
  <PropertyForm /></section></main>;
}
