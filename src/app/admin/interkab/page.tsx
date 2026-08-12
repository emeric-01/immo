import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Building2, ExternalLink, House, MapPin, Phone, RefreshCw } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { requireAdminSession } from "@/lib/admin/auth";
import { requireAdminPermission } from "@/lib/admin/permissions";
import type { City } from "@/lib/cities";
import type { CityMarketData } from "@/lib/city-market-data";
import { readCityMarketCache } from "@/lib/city-market-cache";
import { formatFrenchPhone, getAllStoredInterkabListings, getInterkabCities, getStoredInterkabListings, INTERKAB_CITIES, type InterkabListingFilters } from "@/lib/interkab";
import { scoreInterkabListing } from "@/lib/interkab-scoring";
import admin from "../admin.module.css";
import styles from "./interkab.module.css";
import { syncInterkabCityAction } from "./actions";

export const metadata: Metadata = { title: "Interkab | Admin" };
export const dynamic = "force-dynamic";

type InterkabSearchParams = { ville?: string; type?: string; prixMin?: string; prixMax?: string; surfaceMin?: string; surfaceMax?: string; page?: string; tri?: string };

export default async function InterkabPage({ searchParams }: { searchParams: Promise<InterkabSearchParams> }) {
  const session = await requireAdminSession();
  await requireAdminPermission(session, "properties:read");
  const query = await searchParams;
  const requestedCity = query.ville?.trim() ?? "";
  const selected = INTERKAB_CITIES.find((city) => city.slug === requestedCity || normalize(city.name) === normalize(requestedCity)) ?? null;
  const marketSort = query.tri === "market_asc" || query.tri === "market_desc";
  const allowedSorts = new Set(["recent", "price_asc", "price_desc", "surface_asc", "surface_desc", "ppm_asc", "ppm_desc"]);
  const priceRange = normalizeRange(query.prixMin, query.prixMax);
  const surfaceRange = normalizeRange(query.surfaceMin, query.surfaceMax);
  const propertyCategory = query.type === "house" || query.type === "apartment" ? query.type : undefined;
  const activeSort = marketSort && selected
    ? query.tri
    : allowedSorts.has(query.tri ?? "") ? query.tri : "recent";
  const filters: InterkabListingFilters = {
    inseeCode: selected?.inseeCode,
    minPrice: priceRange.min, maxPrice: priceRange.max,
    minSurface: surfaceRange.min, maxSurface: surfaceRange.max,
    propertyCategory,
    page: boundedPage(query.page), pageSize: 24,
    sort: allowedSorts.has(activeSort ?? "") ? activeSort as InterkabListingFilters["sort"] : "recent",
  };
  let cities: Awaited<ReturnType<typeof getInterkabCities>> = [];
  let listingResult: Awaited<ReturnType<typeof getStoredInterkabListings>> = { listings: [], page: 1, pageSize: 24, total: 0, pageCount: 1 };
  let selectedMarket: CityMarketData | null = null;
  let error = "";
  try {
    [cities, listingResult, selectedMarket] = await Promise.all([
      getInterkabCities(),
      getStoredInterkabListings(filters),
      selected ? getCachedMarketData(selected) : Promise.resolve(null),
    ]);
  } catch (cause) { error = cause instanceof Error ? cause.message : "Lecture Interkab impossible."; }
  const cityState = selected ? cities.find((city) => city.insee_code === selected.inseeCode) : null;
  if (marketSort && selected && selectedMarket) {
    const allListings = await getAllStoredInterkabListings(filters);
    const direction = query.tri === "market_asc" ? 1 : -1;
    allListings.sort((left, right) => {
      const leftGap = scoreInterkabListing(left, [], selectedMarket).marketGapPercent;
      const rightGap = scoreInterkabListing(right, [], selectedMarket).marketGapPercent;
      if (leftGap === null) return 1;
      if (rightGap === null) return -1;
      return (leftGap - rightGap) * direction;
    });
    const start = (filters.page! - 1) * filters.pageSize!;
    listingResult = { listings: allListings.slice(start, start + filters.pageSize!), page: filters.page!, pageSize: filters.pageSize!, total: allListings.length, pageCount: Math.max(1, Math.ceil(allListings.length / filters.pageSize!)) };
  }
  const listings = listingResult.listings;
  const visibleCities = Array.from(
    new Map(
      listings
        .map((listing) => resolveListingCity(listing.city))
        .filter((city): city is City => city !== null)
        .map((city) => [city.inseeCode, city]),
    ).values(),
  );
  const marketEntries = await Promise.all(visibleCities.map(async (city) => [
    city.inseeCode,
    selected?.inseeCode === city.inseeCode && selectedMarket
      ? selectedMarket
      : await getCachedMarketData(city),
  ] as const));
  const marketsByInseeCode = new Map(marketEntries);
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
          <label><span>Type de bien</span><select defaultValue={propertyCategory ?? ""} name="type"><option value="">Maisons et appartements</option><option value="house">Maisons</option><option value="apartment">Appartements</option></select></label>
          <label><span>Prix minimum</span><input defaultValue={query.prixMin} inputMode="numeric" min="0" name="prixMin" placeholder="150 000 €" type="number"/></label>
          <label><span>Prix maximum</span><input defaultValue={query.prixMax} inputMode="numeric" min="0" name="prixMax" placeholder="600 000 €" type="number"/></label>
          <label><span>Surface minimum</span><input defaultValue={query.surfaceMin} inputMode="numeric" min="0" name="surfaceMin" placeholder="50 m²" type="number"/></label>
          <label><span>Surface maximum</span><input defaultValue={query.surfaceMax} inputMode="numeric" min="0" name="surfaceMax" placeholder="200 m²" type="number"/></label>
          <button type="submit">Rechercher</button><Link href="/admin/interkab">Réinitialiser</Link>
        </form>

        <nav className={styles.cityNav} aria-label="Villes Interkab"><Link className={!selected ? styles.cityActive : ""} href="/admin/interkab"><span>Toutes les villes</span><small>{volume} biens connus</small></Link>{cities.map((city) => <Link className={city.slug === selected?.slug ? styles.cityActive : ""} href={`/admin/interkab?ville=${city.slug}`} key={city.insee_code}><span>{city.city_name}</span><small>{city.last_listing_count} biens · {statusLabel(city.status)}</small></Link>)}</nav>

        <div className={styles.sectionTitle}><div><p className={admin.eyebrow}>{listingResult.total} bien{listingResult.total > 1 ? "s" : ""}</p><h2>{selected?.name ?? "Toutes les villes"}</h2></div>{cityState?.last_synced_at ? <small>Actualisé le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(cityState.last_synced_at))}</small> : null}</div>
        <form className={styles.sortBar} method="get">{Object.entries(query).filter(([key, value]) => !["tri", "page"].includes(key) && value).map(([key, value]) => <input key={key} name={key} type="hidden" value={value}/>)}<label><span>Trier les biens</span><select defaultValue={activeSort ?? "recent"} name="tri"><option value="recent">Plus récents</option><option value="price_asc">Prix croissant</option><option value="price_desc">Prix décroissant</option><option value="surface_asc">Surface croissante</option><option value="surface_desc">Surface décroissante</option><option value="ppm_asc">Prix au m² croissant</option><option value="ppm_desc">Prix au m² décroissant</option><option disabled={!selected} value="market_asc">Le plus sous le marché</option><option disabled={!selected} value="market_desc">Le plus au-dessus du marché</option></select></label><button type="submit">Appliquer le tri</button>{!selected ? <small>Sélectionnez une ville pour les tris marché.</small> : null}</form>
        {!listings.length ? <section className={styles.notice}><strong>Aucun bien ne correspond</strong><p>Modifiez les filtres ou laissez la synchronisation nocturne compléter les villes encore en attente.</p></section> : <><div className={styles.grid}>{listings.map((listing) => {
          const phone = formatFrenchPhone(listing.agencyPhone);
          const listingCity = resolveListingCity(listing.city);
          const listingMarket = listingCity ? marketsByInseeCode.get(listingCity.inseeCode) ?? null : null;
          const score = scoreInterkabListing(listing, [], listingMarket);
          const comparisonCity = listingCity?.name ?? listing.city;
          return <article className={styles.card} key={listing.externalId}>
            <div className={styles.cover}>{listing.imageUrl ? <Image alt={`${listing.propertyType} à ${listing.city}`} fill sizes="(max-width: 760px) 100vw, 33vw" src={listing.imageUrl}/> : <House/>}</div>
            <div className={styles.cardBody}>
              <div className={styles.cardTop}><span>{listing.propertyType}</span><strong className={styles.score} data-level={score.interestLabel}>{score.interestScore}/100 · {score.interestLabel}</strong></div>
              <h2>{formatCurrency(listing.price)}</h2>
              <p className={styles.location}><MapPin size={15}/> {listing.city || selected?.name || "Ville non renseignée"}{listing.neighborhood ? ` · ${listing.neighborhood}` : ""}</p>
              <div className={styles.facts}>{listing.surfaceM2 ? <span>{listing.surfaceM2} m²</span> : null}{listing.rooms ? <span>{listing.rooms} pièces</span> : null}{listing.bedrooms ? <span>{listing.bedrooms} chambres</span> : null}{listing.bathrooms ? <span>{listing.bathrooms} salle{listing.bathrooms > 1 ? "s" : ""} de bain/eau</span> : null}{listing.toilets ? <span>{listing.toilets} WC</span> : null}{listing.landAreaM2 ? <span>{listing.landAreaM2} m² terrain</span> : null}{listing.features.slice(0, 8).map((feature) => <span key={feature}>{feature}</span>)}</div>
              {!listing.bathrooms && !listing.toilets && !listing.landAreaM2 && !listing.features.length ? <small className={styles.enrichment}>Caractéristiques détaillées en cours d’enrichissement</small> : null}
              <div className={styles.analysis}><header><strong>Analyse du prix</strong><small>{comparisonCity ? `Comparaison avec ${comparisonCity}` : "Prix ramené à la surface du bien"}</small></header><div><small>Prix affiché au m²</small><strong>{formatPricePerM2(score.pricePerM2)}</strong></div>{listingMarket ? <div><small>Moyenne ville au m²</small><strong>{formatPricePerM2(score.marketPricePerM2)}</strong></div> : null}<p>{listingMarket ? `${score.marketLabel}${score.marketGapPercent !== null ? ` · ${score.marketGapPercent > 0 ? "+" : ""}${score.marketGapPercent} %` : ""}` : "Référence Immo Data indisponible pour cette ville."}</p></div>
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
function normalizeRange(minValue?: string, maxValue?: string) {
  const first = positiveNumber(minValue);
  const second = positiveNumber(maxValue);
  if (first !== undefined && second !== undefined && first > second) return { min: second, max: first };
  return { min: first, max: second };
}
function boundedPage(value?: string) {
  const page = positiveNumber(value);
  return page === undefined ? 1 : Math.min(Math.max(Math.floor(page), 1), 10_000);
}
function normalize(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr-FR"); }
function resolveListingCity(value: string) {
  const normalized = normalize(value).replace(/\s*\(?(?:13|83)\d{3}\)?\s*$/, "").trim();
  return INTERKAB_CITIES.find((city) => normalize(city.name) === normalized) ?? null;
}
async function getCachedMarketData(city: City) {
  const cached = await readCityMarketCache(city);
  return cached?.data ?? null;
}

function Pagination({ page, pageCount, query }: { page: number; pageCount: number; query: InterkabSearchParams }) {
  if (pageCount <= 1) return null;
  const href = (target: number) => { const params = new URLSearchParams(Object.entries(query).filter(([key, value]) => key !== "page" && value) as Array<[string, string]>); params.set("page", String(target)); return `/admin/interkab?${params}`; };
  return <nav className={styles.pagination} aria-label="Pagination des biens">{page > 1 ? <Link href={href(page - 1)}>← Page précédente</Link> : <span/>}<strong>Page {page} sur {pageCount}</strong>{page < pageCount ? <Link href={href(page + 1)}>Page suivante →</Link> : <span/>}</nav>;
}
