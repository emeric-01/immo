import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Building2, ExternalLink, House, MapPin, Phone, RefreshCw } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { requireAdminSession } from "@/lib/admin/auth";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { getCityBySlug } from "@/lib/cities";
import { getCityMarketData } from "@/lib/city-market-data";
import { formatFrenchPhone, getInterkabCities, getStoredInterkabListings, INTERKAB_CITIES, seedInterkabCities } from "@/lib/interkab";
import { scoreInterkabListing } from "@/lib/interkab-scoring";
import admin from "../admin.module.css";
import styles from "./interkab.module.css";
import { syncInterkabCityAction } from "./actions";

export const metadata: Metadata = { title: "Interkab | Admin" };
export const dynamic = "force-dynamic";

export default async function InterkabPage({ searchParams }: { searchParams: Promise<{ ville?: string }> }) {
  const session = await requireAdminSession();
  await requireAdminPermission(session, "properties:read");
  const requestedSlug = (await searchParams).ville ?? "aubagne";
  const selected = INTERKAB_CITIES.find((city) => city.slug === requestedSlug) ?? INTERKAB_CITIES[0];
  let cities: Awaited<ReturnType<typeof getInterkabCities>> = [];
  let listings: Awaited<ReturnType<typeof getStoredInterkabListings>> = [];
  let error = "";
  try {
    await seedInterkabCities();
    [cities, listings] = await Promise.all([getInterkabCities(), getStoredInterkabListings(selected.inseeCode)]);
  } catch (cause) { error = cause instanceof Error ? cause.message : "Lecture Interkab impossible."; }
  const cityState = cities.find((city) => city.insee_code === selected.inseeCode);
  const marketCity = getCityBySlug(selected.slug);
  const market = marketCity ? await getCityMarketData(marketCity).catch(() => null) : null;
  const readyCount = cities.filter((city) => city.status === "ready").length;
  const volume = cities.reduce((sum, city) => sum + city.last_listing_count, 0);

  return <main className={admin.adminPage}>
    <AdminSidebar active="/admin/interkab" session={session}/>
    <section className={`${admin.content} ${styles.content}`}>
      <header className={admin.pageHeader}>
        <div><p className={admin.eyebrow}>Réseau Interkab · usage interne</p><h1>Veille des biens</h1><p>Synchronisation privée des villes couvertes dans le 13 et le 83. Aucun bien n’est publié côté client.</p></div>
        <form action={syncInterkabCityAction}><input name="inseeCode" type="hidden" value={selected.inseeCode}/><button className={admin.secondaryButton} type="submit"><RefreshCw size={17}/> Actualiser {selected.name}</button></form>
      </header>

      {error ? <section className={styles.notice}><strong>Base Interkab indisponible</strong><p>{error}</p></section> : <>
        <section className={styles.stats}>
          <article><MapPin/><span>Villes suivies</span><strong>{cities.length}</strong><small>Départements 13 et 83</small></article>
          <article><RefreshCw/><span>Villes initialisées</span><strong>{readyCount}</strong><small>Cycle automatique de 4 jours</small></article>
          <article><House/><span>Volume réseau connu</span><strong>{volume}</strong><small>Dernier volume remonté par ville</small></article>
          <article><Building2/><span>Ville consultée</span><strong>{selected.name}</strong><small>{cityState?.interkab_location_id ?? "À initialiser"}</small></article>
        </section>

        <section className={styles.pilotNote}><strong>Déploiement progressif</strong><p>Aubagne démarre en premier. Le traitement quotidien prend ensuite les villes arrivées à échéance, par lots de 11, afin de couvrir les 43 villes en quatre jours sans recopier les photos dans Supabase.</p></section>

        <nav className={styles.cityNav} aria-label="Villes Interkab">{cities.map((city) => <Link className={city.slug === selected.slug ? styles.cityActive : ""} href={`/admin/interkab?ville=${city.slug}`} key={city.insee_code}><span>{city.city_name}</span><small>{city.last_listing_count} biens · {statusLabel(city.status)}</small></Link>)}</nav>

        <div className={styles.sectionTitle}><div><p className={admin.eyebrow}>Dernière collecte</p><h2>{selected.name}</h2></div>{cityState?.last_synced_at ? <small>Actualisé le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(cityState.last_synced_at))}</small> : <small>Pas encore synchronisé</small>}</div>
        {!listings.length ? <section className={styles.notice}><strong>Aucun échantillon enregistré</strong><p>Lancez l’actualisation de {selected.name}, ou laissez la synchronisation automatique traiter cette ville.</p></section> : <div className={styles.grid}>{listings.map((listing) => {
          const phone = formatFrenchPhone(listing.agencyPhone);
          const score = scoreInterkabListing(listing, [], market);
          return <article className={styles.card} key={listing.externalId}>
            <div className={styles.cover}>{listing.imageUrl ? <Image alt={`${listing.propertyType} à ${selected.name}`} fill sizes="(max-width: 760px) 100vw, 33vw" src={listing.imageUrl}/> : <House/>}</div>
            <div className={styles.cardBody}>
              <div className={styles.cardTop}><span>{listing.propertyType}</span><strong className={styles.score} data-level={score.interestLabel}>{score.interestScore}/100 · {score.interestLabel}</strong></div>
              <h2>{formatCurrency(listing.price)}</h2>
              <p className={styles.location}><MapPin size={15}/> {listing.city || selected.name}{listing.neighborhood ? ` · ${listing.neighborhood}` : ""}</p>
              <div className={styles.facts}>{listing.surfaceM2 ? <span>{listing.surfaceM2} m²</span> : null}{listing.rooms ? <span>{listing.rooms} pièces</span> : null}{listing.bedrooms ? <span>{listing.bedrooms} chambres</span> : null}{listing.landAreaM2 ? <span>{listing.landAreaM2} m² terrain</span> : null}</div>
              <div className={styles.analysis}><header><strong>Comparatif prix · {score.marketPropertyTypeLabel ?? listing.propertyType}</strong><small>Moyenne observée à {selected.name}</small></header><div><small>Prix affiché au m²</small><strong>{formatPricePerM2(score.pricePerM2)}</strong></div><div><small>Moyenne ville au m²</small><strong>{formatPricePerM2(score.marketPricePerM2)}</strong></div><p>{score.marketLabel}{score.marketGapPercent !== null ? ` · ${score.marketGapPercent > 0 ? "+" : ""}${score.marketGapPercent} %` : ""}</p></div>
              <div className={styles.agency}><small>Agence référente</small><strong>{listing.agencyName ?? listing.agentLabel ?? "À enrichir"}</strong>{phone ? <a href={`tel:${listing.agencyPhone}`}><Phone size={15}/> {phone}</a> : <span>Téléphone non chargé</span>}</div>
              <div className={styles.actions}><a href={listing.listingUrl} rel="noreferrer" target="_blank"><ExternalLink size={16}/> Ouvrir sur Interkab</a>{listing.agencySiteUrl ? <a href={listing.agencySiteUrl} rel="noreferrer" target="_blank">Site agence</a> : null}<small>Réf. {listing.externalId}</small></div>
            </div>
          </article>;
        })}</div>}
      </>}
    </section>
  </main>;
}

function statusLabel(status: string) { return status === "ready" ? "à jour" : status === "error" ? "erreur" : "en attente"; }
function formatCurrency(value: number | null) { return value === null ? "Prix non renseigné" : new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value); }
function formatPricePerM2(value: number | null) { return value === null ? "Non disponible" : `${new Intl.NumberFormat("fr-FR").format(value)} €/m²`; }
