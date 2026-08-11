import type { Metadata } from "next";
import Image from "next/image";
import { Building2, ExternalLink, House, MapPin, Phone, RefreshCw } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { requireAdminSession } from "@/lib/admin/auth";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { AUBAGNE_INTERKAB_URL, formatFrenchPhone, getAubagneInterkabPilot } from "@/lib/interkab";
import admin from "../admin.module.css";
import styles from "./interkab.module.css";

export const metadata: Metadata = { title: "Interkab Aubagne | Admin" };
export const dynamic = "force-dynamic";

export default async function InterkabPilotPage() {
  const session = await requireAdminSession();
  await requireAdminPermission(session, "properties:read");

  let pilot: Awaited<ReturnType<typeof getAubagneInterkabPilot>> | null = null;
  let error = "";
  try {
    pilot = await getAubagneInterkabPilot();
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Lecture Interkab impossible.";
  }

  return <main className={admin.adminPage}>
    <AdminSidebar active="/admin/interkab" session={session}/>
    <section className={`${admin.content} ${styles.content}`}>
      <header className={admin.pageHeader}>
        <div><p className={admin.eyebrow}>Pilote réseau Interkab</p><h1>Aubagne</h1><p>Première lecture interne des biens du réseau, sans publication sur votre site.</p></div>
        <a className={admin.secondaryButton} href={AUBAGNE_INTERKAB_URL} rel="noreferrer" target="_blank"><ExternalLink size={17}/> Voir la recherche Interkab</a>
      </header>

      {error || !pilot ? <section className={styles.notice}><strong>Synchronisation indisponible</strong><p>{error}</p></section> : <>
        <section className={styles.stats}>
          <article><House/><span>Volume Aubagne</span><strong>{pilot.resultCount}</strong><small>{pilot.pageCount} pages détectées</small></article>
          <article><RefreshCw/><span>Échantillon pilote</span><strong>{pilot.listings.length}</strong><small>Première page uniquement</small></article>
          <article><Building2/><span>Fiches enrichies</span><strong>{pilot.listings.filter((item) => item.agencyName).length}</strong><small>Agence et téléphone</small></article>
          <article><MapPin/><span>Identifiant ville</span><strong>4462_662</strong><small>Aubagne · 13400</small></article>
        </section>

        <section className={styles.pilotNote}><strong>Mode test</strong><p>La lecture est mise en cache pendant quatre jours. Seules les six premières fiches sont ouvertes pour enrichir l’agence et le téléphone ; aucune donnée n’est publiée.</p></section>

        <div className={styles.grid}>{pilot.listings.map((listing) => {
          const phone = formatFrenchPhone(listing.agencyPhone);
          return <article className={styles.card} key={listing.externalId}>
            <div className={styles.cover}>{listing.imageUrl ? <Image alt={`${listing.propertyType} à Aubagne`} fill sizes="(max-width: 760px) 100vw, 33vw" src={listing.imageUrl}/> : <House/>}</div>
            <div className={styles.cardBody}>
              <div className={styles.cardTop}><span>{listing.propertyType}</span><small>Réf. {listing.externalId}</small></div>
              <h2>{formatCurrency(listing.price)}</h2>
              <p className={styles.location}><MapPin size={15}/> {listing.city || "Aubagne"}</p>
              <div className={styles.facts}>{listing.surfaceM2 ? <span>{listing.surfaceM2} m²</span> : null}{listing.rooms ? <span>{listing.rooms} pièces</span> : null}{listing.bedrooms ? <span>{listing.bedrooms} chambres</span> : null}</div>
              <div className={styles.agency}>
                <small>Agence référente</small><strong>{listing.agencyName ?? listing.agentLabel ?? "À enrichir"}</strong>
                {phone ? <a href={`tel:${listing.agencyPhone}`}><Phone size={15}/> {phone}</a> : <span>Téléphone non chargé dans ce test</span>}
              </div>
              <div className={styles.actions}><a href={listing.listingUrl} rel="noreferrer" target="_blank"><ExternalLink size={16}/> Ouvrir sur Interkab</a>{listing.agencySiteUrl ? <a href={listing.agencySiteUrl} rel="noreferrer" target="_blank">Site agence</a> : null}</div>
            </div>
          </article>;
        })}</div>
      </>}
    </section>
  </main>;
}

function formatCurrency(value: number | null) {
  return value === null ? "Prix non renseigné" : new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}
