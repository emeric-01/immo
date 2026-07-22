import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarClock, CheckCircle2, Euro, Inbox, Phone, Search, UserRound } from "lucide-react";
import {
  type AdminBuyerSearchRow,
  formatAdminPropertyTypes,
  formatPreferredChannel,
  getAdminBuyerSearches,
  getBuyerSearchAdminStats,
} from "@/lib/admin/buyer-searches";
import { requireAdminSession } from "@/lib/admin/auth";
import { logoutAdmin } from "../login/actions";
import styles from "../admin.module.css";

export const metadata: Metadata = {
  title: "Recherches acheteurs | Admin",
};

export const dynamic = "force-dynamic";

const statusOptions = [
  { label: "Tous les statuts", value: "all" },
  { label: "Nouveau", value: "new" },
  { label: "Contacte", value: "contacted" },
  { label: "Matching", value: "matched" },
  { label: "Qualifie", value: "qualified" },
  { label: "En pause", value: "paused" },
  { label: "Clos", value: "closed" },
  { label: "Supprimee par l'utilisateur", value: "deleted_by_client" },
];

export default async function AdminBuyerSearchesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireAdminSession();
  const params = await searchParams;
  const result = await getAdminBuyerSearches({ q: params.q, status: params.status });

  return (
    <AdminFrame>
      <section className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Recherches acheteurs</p>
          <h1>Vue globale des formulaires</h1>
          <p>Suivez les nouveaux projets, les budgets, les secteurs et les prochains contacts.</p>
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
        <>
          <StatsGrid searches={result.data} />
          <form className={styles.filterBar}>
            <label className={styles.searchField}>
              <Search size={18} aria-hidden="true" />
              <input defaultValue={params.q ?? ""} name="q" placeholder="Rechercher nom, email, telephone, ville..." />
            </label>
            <select defaultValue={params.status ?? "all"} name="status">
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button type="submit">Filtrer</button>
          </form>
          {result.data.length > 0 ? <SearchTable searches={result.data} /> : <EmptyState title="Aucune recherche" text="Aucun formulaire ne correspond aux filtres actuels." />}
        </>
      )}
    </AdminFrame>
  );
}

function AdminFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className={styles.adminPage}>
      <aside className={styles.sidebar}>
        <div className={styles.brandMark}>
          <span>les jumelles</span>
          <strong>IMMO</strong>
        </div>
        <nav>
          <Link href="/admin/biens">Biens</Link>
          <Link data-active href="/admin/recherches">
            Recherches
          </Link>
          <Link href="/admin/estimations">Estimations</Link>
          <Link href="/admin/parrainages">Parrainages</Link>
          <Link href="/admin/clients">Clients</Link>
          <Link href="/admin/recherches-villes">Villes recherchées</Link>
          <Link href="/admin/contenus">Contenus</Link>
          <Link href="/admin/utilisateurs">Utilisateurs</Link>
        </nav>
      </aside>
      <section className={styles.content}>{children}</section>
    </main>
  );
}

function StatsGrid({ searches }: { searches: AdminBuyerSearchRow[] }) {
  const stats = getBuyerSearchAdminStats(searches);
  const cards = [
    { icon: Inbox, label: "Formulaires", value: stats.total },
    { icon: CalendarClock, label: "Nouveaux", value: stats.newCount },
    { icon: Phone, label: "Contactes", value: stats.contactedCount },
    { icon: CheckCircle2, label: "Matches", value: stats.matchedCount },
    { icon: Euro, label: "Budget moyen", value: formatCurrency(stats.averageBudget) },
  ];

  return (
    <div className={styles.statsGrid}>
      {cards.map((card) => (
        <article className={styles.statCard} key={card.label}>
          <span>
            <card.icon size={18} aria-hidden="true" />
          </span>
          <p>{card.label}</p>
          <strong>{card.value}</strong>
        </article>
      ))}
    </div>
  );
}

function SearchTable({
  searches,
}: {
  searches: AdminBuyerSearchRow[];
}) {
  return (
    <div className={styles.tablePanel}>
      <table>
        <thead>
          <tr>
            <th>Client</th>
            <th>Recherche</th>
            <th>Budget</th>
            <th>Coherence</th>
            <th>Contact</th>
            <th>Statut</th>
            <th aria-label="Detail" />
          </tr>
        </thead>
        <tbody>
          {searches.map((search) => (
            <tr key={search.id}>
              <td>
                <div className={styles.clientCell}>
                  <span>
                    <UserRound size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <strong>
                      {search.contact_first_name} {search.contact_last_name}
                    </strong>
                    <small>{formatDate(search.created_at)}</small>
                  </div>
                </div>
              </td>
              <td>
                <strong>{formatAdminPropertyTypes(search.property_types)}</strong>
                <small>{search.location_summary || "Secteur non renseigne"}</small>
              </td>
              <td>
                <strong>{formatCurrency(search.maximum_budget)}</strong>
                <small>{search.minimum_living_area ? `${search.minimum_living_area} m2 min.` : "Surface non renseignee"}</small>
              </td>
              <td>
                {search.market_score !== null ? (
                  <span className={styles.marketScoreBadge} data-score={scoreTone(search.market_score)}>
                    {search.market_score}/100
                  </span>
                ) : (
                  <small>Non calcule</small>
                )}
              </td>
              <td>
                <strong>{formatPreferredChannel(search.preferred_channel)}</strong>
                <small>{search.contact_email}</small>
              </td>
              <td>
                <span className={styles.statusBadge} data-status={search.status}>
                  {formatStatus(search.status)}
                </span>
                {search.deleted_at ? <small>Le {formatDate(search.deleted_at)}</small> : null}
              </td>
              <td>
                <Link className={styles.iconLink} href={`/admin/recherches/${search.id}`}>
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <section className={styles.emptyState}>
      <Inbox size={26} aria-hidden="true" />
      <h2>{title}</h2>
      <p>{text}</p>
    </section>
  );
}

function formatCurrency(value?: number | null) {
  if (!value) {
    return "Non renseigne";
  }

  return new Intl.NumberFormat("fr-FR", {
    currency: "EUR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatStatus(status: string) {
  return (
    {
      closed: "Clos",
      contacted: "Contacte",
      matched: "Matching",
      new: "Nouveau",
      paused: "Pause",
      qualified: "Qualifie",
      deleted_by_client: "Supprimee par l'utilisateur",
    }[status] ?? status
  );
}

function scoreTone(score: number) {
  if (score >= 70) {
    return "positive";
  }

  if (score >= 55) {
    return "warning";
  }

  return "difficult";
}
