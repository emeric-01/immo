import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, Inbox, MapPin, Search, TrendingUp } from "lucide-react";
import { requireAdminSession } from "@/lib/admin/auth";
import { getAdminCitySearchMisses, type AdminCitySearchMisses } from "@/lib/admin/city-search-misses";
import { logoutAdmin } from "../login/actions";
import styles from "../admin.module.css";

export const metadata: Metadata = {
  title: "Villes recherchees | Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminCitySearchMissesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdminSession();
  const params = await searchParams;
  const result = await getAdminCitySearchMisses({ q: params.q });

  return (
    <main className={styles.adminPage}>
      <Sidebar />
      <section className={styles.content}>
        <section className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>Observatoire SEO</p>
            <h1>Villes recherchées</h1>
            <p>Repérez les villes tapées par les visiteurs lorsqu’elles ne disposent pas encore d’une page prix au m².</p>
          </div>
          <form action={logoutAdmin}>
            <button className={styles.secondaryButton} type="submit">
              Deconnexion
            </button>
          </form>
        </section>

        {result.status !== "ready" ? (
          <EmptyState title="Lecture BDD a finaliser" text={result.message} />
        ) : (
          <CitySearchMissContent data={result.data} params={params} />
        )}
      </section>
    </main>
  );
}

function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brandMark}>
        <span>les jumelles</span>
        <strong>IMMO</strong>
      </div>
      <nav>
        <Link href="/admin/recherches">Recherches</Link>
        <Link href="/admin/estimations">Estimations</Link>
        <Link href="/admin/clients">Clients</Link>
        <Link data-active href="/admin/recherches-villes">
          Villes recherchées
        </Link>
        <Link href="/admin/utilisateurs">Utilisateurs</Link>
      </nav>
    </aside>
  );
}

function CitySearchMissContent({
  data,
  params,
}: {
  data: AdminCitySearchMisses;
  params: { q?: string };
}) {
  const cards = [
    { icon: Search, label: "Recherches", value: data.stats.totalEvents },
    { icon: MapPin, label: "Villes uniques", value: data.stats.uniqueQueries },
    { icon: CalendarClock, label: "7 derniers jours", value: data.stats.recentCount },
    { icon: TrendingUp, label: "Top demande", value: data.stats.topQuery },
    { icon: Inbox, label: "Volume top", value: data.stats.topQueryCount },
  ];

  return (
    <>
      <div className={styles.statsGrid}>
        {cards.map((card) => (
          <article className={styles.statCard} key={card.label}>
            <span>
              <card.icon aria-hidden="true" size={18} />
            </span>
            <p>{card.label}</p>
            <strong>{card.value}</strong>
          </article>
        ))}
      </div>

      <form className={styles.filterBar} data-compact>
        <label className={styles.searchField}>
          <Search aria-hidden="true" size={18} />
          <input defaultValue={params.q ?? ""} name="q" placeholder="Filtrer par ville ou variante..." />
        </label>
        <button type="submit">Filtrer</button>
      </form>

      {data.rows.length > 0 ? (
        <div className={styles.tablePanel}>
          <table>
            <thead>
              <tr>
                <th>Ville saisie</th>
                <th>Nombre</th>
                <th>Première recherche</th>
                <th>Dernière recherche</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.normalizedQuery}>
                  <td>
                    <strong>{row.displayQuery}</strong>
                    <small>{row.normalizedQuery}</small>
                  </td>
                  <td>
                    <strong>{row.searchCount}</strong>
                    <small>{row.searchCount > 1 ? "recherches" : "recherche"}</small>
                  </td>
                  <td>{formatDate(row.firstSearchedAt)}</td>
                  <td>{formatDate(row.lastSearchedAt)}</td>
                  <td>
                    <span className={styles.statusBadge}>Non référencée</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="Aucune ville manquante" text="Aucune recherche inconnue ne correspond aux filtres actuels." />
      )}
    </>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <section className={styles.emptyState}>
      <Inbox aria-hidden="true" size={26} />
      <h2>{title}</h2>
      <p>{text}</p>
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
