import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarClock, Inbox, Search, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { requireAdminSession } from "@/lib/admin/auth";
import {
  type AdminClientListItem,
  formatAdminClientName,
  formatAdminClientPropertyTypes,
  getAdminClients,
  getAdminClientStats,
} from "@/lib/admin/clients";
import { logoutAdmin } from "../login/actions";
import styles from "../admin.module.css";

export const metadata: Metadata = {
  title: "Clients | Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdminSession();
  const params = await searchParams;
  const result = await getAdminClients({ q: params.q });

  return (
    <AdminFrame>
      <section className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Comptes clients</p>
          <h1>Vue globale des clients</h1>
          <p>Consultez les clients crees automatiquement, leur derniere demande et leur activite.</p>
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
          <StatsGrid clients={result.data} />
          <form className={styles.filterBar} data-compact>
            <label className={styles.searchField}>
              <Search size={18} aria-hidden="true" />
              <input defaultValue={params.q ?? ""} name="q" placeholder="Rechercher nom, email, telephone, ville..." />
            </label>
            <button type="submit">Filtrer</button>
          </form>
          {result.data.length > 0 ? (
            <ClientTable clients={result.data} />
          ) : (
            <EmptyState title="Aucun client" text="Aucun compte client ne correspond aux filtres actuels." />
          )}
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
          <Link href="/admin/recherches">Recherches</Link>
          <Link href="/admin/estimations">Estimations</Link>
          <Link data-active href="/admin/clients">
            Clients
          </Link>
          <Link href="/admin/recherches-villes">Villes recherchées</Link>
          <Link href="/admin/utilisateurs">Utilisateurs</Link>
        </nav>
      </aside>
      <section className={styles.content}>{children}</section>
    </main>
  );
}

function StatsGrid({ clients }: { clients: AdminClientListItem[] }) {
  const stats = getAdminClientStats(clients);
  const cards = [
    { icon: UsersRound, label: "Clients", value: stats.total },
    { icon: ShieldCheck, label: "Acces actifs", value: stats.activeCount },
    { icon: Inbox, label: "Avec demande", value: stats.withSearchCount },
    { icon: ArrowRight, label: "Multi-demandes", value: stats.returningCount },
    { icon: CalendarClock, label: "7 derniers jours", value: stats.recentCount },
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

function ClientTable({ clients }: { clients: AdminClientListItem[] }) {
  return (
    <div className={styles.tablePanel}>
      <table>
        <thead>
          <tr>
            <th>Client</th>
            <th>Derniere demande</th>
            <th>Acces</th>
            <th>Activite</th>
            <th aria-label="Detail" />
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id}>
              <td>
                <div className={styles.clientCell}>
                  <span>
                    <UserRound size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <strong>{formatAdminClientName(client)}</strong>
                    <small>{client.email}</small>
                    <small>{client.phone || "Telephone non renseigne"}</small>
                  </div>
                </div>
              </td>
              <td>
                <strong>{client.lastSearch ? formatAdminClientPropertyTypes(client.lastSearch.property_types) : "Aucune demande"}</strong>
                <small>{client.lastSearch?.location_summary || "Secteur non renseigne"}</small>
              </td>
              <td>
                <span className={styles.statusBadge} data-status={client.access_enabled ? "matched" : "paused"}>
                  {client.access_enabled ? "Actif" : "Desactive"}
                </span>
                <small>Connexion par email</small>
              </td>
              <td>
                <strong>{client.searchesCount} demande(s)</strong>
                <small>MAJ {formatDate(client.updated_at)}</small>
              </td>
              <td>
                <Link className={styles.iconLink} href={`/admin/clients/${client.id}`}>
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
