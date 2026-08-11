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

type InterkabSearchParams = { ville?: string; prixMin?: string; prixMax?: string; surfaceMin?: string; surfaceMax?: string; page?: string };

export default async function InterkabPage({ searchParams }: { searchParams: Promise<InterkabSearchParams> }) {
  const session = await requireAdminSession();
  await requireAdminPermission(session, "properties:read");
  const query = await searchParams;
  const requestedCity = query.ville?.trim() ?? "";
  const selected = INTERKAB_CITIES.find((city) => city.slug === requestedCity || normalize(city.name) === normalize(requestedCity)) ?? null;
  const filters = {
    inseeCode: selected?.inseeCode,
    minPrice: positiveNumber(query.prixMin), maxPrice: positiveNumber(query.prixMax),
    minSurface: positiveNumber(query.surfaceMin), maxSurface: positiveNumber(query.surfaceMax),
    page: positiveNumber(query.page) ?? 1, pageSize: 24,
  };
  let cities: Awaited<ReturnType<typeof getInterkabCities>> = [];
  let listingResult: Awaited<ReturnType<typeof getStoredInterkabListings>> = { listings: [], page: 1, pageSize: 24, total: 0, pageCount: 1 };
  let error = "";
  try {
    await seedInterkabCities();
    [cities, listingResult] = await Promise.all([getInterkabCities(), getStoredInterkabListings(filters)]);
  } catch (cause) { error = cause instanceof Error ? cause.message : "Lecture Interkab impossible."; }
  const listings = listingResult.listings;
  const cityState = selected ? cities.find((city) => city.insee_code === selected.inseeCode) : null;
  const marketCity = selected ? getCityBySlug(selected.slug) : null;
  const market = marketCity ? await getCityMarketData(marketCity).catch(() => null) : null;
  const readyCount = cities.filter((city) => city.status === "ready").length;
  const volume = cities.reduce((sum, city) => sum + city.last_listing_count, 0);

  return <main className={admin.adminPage}>
    <AdminSidebar active="/admin/interkab" session={session}/>
    <section className={`${admin.content} ${styles.content}`}>
      <header className={admin.pageHeader}>
        <div><p className={admin.eyebrow}>Réseau Interkab · usage interne</p><h1>Veille des biens</h1><p>Synchronisation privée des villes couvertes dans le 13 et le 83. Aucun bien n’est publié côté client.</p></div>
        {selected ? <form action={syncInterkabCityAction}><input name="inseeCode" type="hidden" value={selected.inseeCode}/><button className={admin.secondaryButton} type="submit"><RefreshCw size={17}/> Actualiser {selected.name}</button></form> : null}
      </header>

      {error ? <section className={styles.notice}><strong>Base Interkab indisponible</strong><p>{error}</p></section> : <>
        <section className={styles.stats}>
          <article><MapPin/><span>Villes suivies</span><strong>{cities.length}</strong><small>Départements 13 et 83</small></article>
          <article><RefreshCw/><span>Villes initialisées</span><strong>{readyCount}</strong><small>Cycle automatique de 4 jours</small></article>
          <article><House/><span>Volume réseau connu</span><strong>{volume}</strong><small>Dernier volume remonté par ville</small></article>
          <article><Building2/><span>Résultats filtrés</span><strong>{listingResult.total}</strong><small>{selected?.name ?? "Toutes les villes"}</small></article>
        </section>

        <section className={styles.pilotNote}><strong>Catalogue complet</strong><p>Aubagne démarre en premier. Onze lots nocturnes traitent ensuite quatre villes à la fois et parcourent toutes leurs pages, afin de couvrir les 43 villes sans recopier les photos dans Supabase.</p></section>

        <form className={styles.filters} method="get">
          <label><span>Ville</span><input autoComplete="off" defaultValue={selected?.name ?? ""} list="interkab-cities" name="ville" placeholder="Toutes les villes" type="search"/><datalist id="interkab-cities">{cities.map((city) => <option key={city.insee_code} value={city.city_name}>{city.last_listing_count} biens</option>)}</datalist></label>
          <label><span>Prix minimum</span><input defaultValue={query.prixMin} inputMode="numeric" min="0" name="prixMin" placeholder="150 000 €" type="number"/></label>
          <label><span>Prix maximum</span><input defaultValue={query.prixMax} inputMode="numeric" min="0" name="prixMax" placeholder="600 000 €" type="number"/></label>
          <label><span>Surface minimum</span><input defaultValue={query.surfaceMin} inputMode="numeric" min="0" name="surfaceMin" placeholder="50 m²" type="number"/></label>
          <label><span>Surface maximum</span><input defaultValue={query.surfaceMax} inputMode="numeric" min="0" name="surfaceMax" placeholder="200 m²" type="number"/></label>
          <button type="submit">Rechercher</button><Link href="/admin/interkab">Réinitialiser</Link>
        </form>

        <nav className={styles.cityNav} aria-label="Villes Interkab"><Link className={!selected ? styles.cityActive : ""} href="/admin/interkab"><span>Toutes les villes</span><small>{volume} biens connus</small></Link>{cities.map((city) => <Link className={city.slug === selected?.slug ? styles.cityActive : ""} href={`/admin/interkab?ville=${city.slug}`} key={city.insee_code}><span>{city.city_name}</span><small>{city.last_listing_count} biens · {statusLabel(city.status)}</small></Link>)}</nav>

        <div className={styles.sectionTitle}><div><p className={admin.eyebrow}>{listingResult.total} bien{listingResult.total > 1 ? "s" : ""}</p><h2>{selected?.name ?? "Toutes les villes"}</h2></div>{cityState?.last_synced_at ? <small>Actualisé le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(cityState.last_synced_at))}</small> : null}</div>
        {!listings.length ? <section className={styles.notice}><strong>Aucun bien ne correspond</strong><p>Modifiez les filtres ou laissez la synchronisation nocturne compléter les villes encore en attente.</p></section> : <><div className={styles.grid}>{listings.map((listing) => {
          const phone = formatFrenchPhone(listing.agencyPhone);
          const score = scoreInterkabListing(listing, [], market);
          return <article className={styles.card} key={listing.externalId}>
            <div className={styles.cover}>{listing.imageUrl ? <Image alt={`${listing.propertyType} à ${listing.city}`} fill sizes="(max-width: 760px) 100vw, 33vw" src={listing.imageUrl}/> : <House/>}</div>
            <div className={styles.cardBody}>
              <div className={styles.cardTop}><span>{listing.propertyType}</span><strong className={styles.score} data-level={score.interestLabel}>{score.interestScore}/100 · {score.interestLabel}</strong></div>
              <h2>{formatCurrency(listing.price)}</h2>
              <p className={styles.location}><MapPin size={15}/> {listing.city || selected?.name || "Ville non renseignée"}{listing.neighborhood ? ` · ${listing.neighborhood}` : ""}</p>
              <div className={styles.facts}>{listing.surfaceM2 ? <span>{listing.surfaceM2} m²</span> : null}{listing.rooms ? <span>{listing.rooms} pièces</span> : null}{listing.bedrooms ? <span>{listing.bedrooms} chambres</span> : null}{listing.landAreaM2 ? <span>{listing.landAreaM2} m² terrain</span> : null}</div>
              <div className={styles.analysis}><header><strong>Analyse du prix</strong><small>{selected ? `Comparaison avec ${selected.name}` : "Prix ramené à la surface du bien"}</small></header><div><small>Prix affiché au m²</small><strong>{formatPricePerM2(score.pricePerM2)}</strong></div>{selected ? <div><small>Moyenne ville au m²</small><strong>{formatPricePerM2(score.marketPricePerM2)}</strong></div> : null}<p>{selected ? `${score.marketLabel}${score.marketGapPercent !== null ? ` · ${score.marketGapPercent > 0 ? "+" : ""}${score.marketGapPercent} %` : ""}` : "Sélectionnez une ville pour afficher le comparatif local."}</p></div>
              <div className={styles.agency}><small>Agence référente</small><strong>{listing.agencyName ?? listing.agentLabel ?? "À enrichir"}</strong>{phone ? <a href={`tel:${listing.agencyPhone}`}><Phone size={15}/> {phone}</a> : <span>Téléphone non chargé</span>}</div>
              <div className={styles.actions}><a href={listing.listingUrl} rel="noreferrer" target="_blank"><ExternalLink size={16}/> Ouvrir sur Interkab</a>{listing.agencySiteUrl ? <a href={listing.agencySiteUrl} rel="noreferrer" target="_blank">Site agence</a> : null}<small>Réf. {listing.externalId}</small></div>
            </div>
          </article>;
        })}</div><Pagination page={listingResult.page} pageCount={listingResult.pageCount} query={query}/></>}
      </>}
    </section>
  </main>;
}

function statusLabel(status: string) { return status === "ready" ? "à jour" : status === "error" ? "erreur" : "en attente"; }
function formatCurrency(value: number | null) { return value === null ? "Prix non renseigné" : new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value); }
function formatPricePerM2(value: number | null) { return value === null ? "Non disponible" : `${new Intl.NumberFormat("fr-FR").format(value)} €/m²`; }

function positiveNumber(value?: string) { const parsed = Number(value); return value && Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined; }
function normalize(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr-FR"); }

function Pagination({ page, pageCount, query }: { page: number; pageCount: number; query: InterkabSearchParams }) {
  if (pageCount <= 1) return null;
  const href = (target: number) => { const params = new URLSearchParams(Object.entries(query).filter(([key, value]) => key !== "page" && value) as Array<[string, string]>); params.set("page", String(target)); return `/admin/interkab?${params}`; };
  return <nav className={styles.pagination} aria-label="Pagination des biens">{page > 1 ? <Link href={href(page - 1)}>← Page précédente</Link> : <span/>}<strong>Page {page} sur {pageCount}</strong>{page < pageCount ? <Link href={href(page + 1)}>Page suivante →</Link> : <span/>}</nav>;
}
