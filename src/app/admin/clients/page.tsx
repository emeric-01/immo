import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarClock, Inbox, Plus, Search, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { requireAdminSession } from "@/lib/admin/auth";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import type { AdminSession } from "@/lib/admin/auth";
import {
  type AdminClientListItem,
  formatAdminClientName,
  formatAdminClientPropertyTypes,
  getAdminClients,
  getAdminClientStats,
} from "@/lib/admin/clients";
import { logoutAdmin } from "../login/actions";
import styles from "../admin.module.css";
import { formatAdminAttribution } from "@/lib/admin/attribution-display";
import { getCrmContacts, type CrmContact } from "@/lib/admin/crm-contacts";
import { getAdminUserSummary } from "@/lib/admin/users";

export const metadata: Metadata = {
  title: "Clients | Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireAdminSession();
  await requireAdminPermission(session, "clients:read");
  const params = await searchParams;
  const [result, crmResult] = await Promise.all([getAdminClients({ q: params.q }, session), getCrmContacts(session)]);

  return (
    <AdminFrame session={session}>
      <section className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Comptes clients</p>
          <h1>Vue globale de vos clients</h1>
          <p>Consultez vos clients, leur dernière demande et leur activité.</p>
        </div>
        <div className={styles.headerActions}><Link className={styles.secondaryButton} href="/admin/clients/nouveau"><Plus size={18}/>Ajouter un contact</Link><form action={logoutAdmin}><button className={styles.secondaryButton} type="submit">Deconnexion</button></form></div>
      </section>

      {result.status !== "ready" ? (
        <EmptyState title="Lecture BDD a finaliser" text={result.message} />
      ) : (
        <>
          <StatsGrid clients={result.data} />
          {crmResult.status === "ready" ? <CrmContactsPanel contacts={crmResult.data} /> : <EmptyState title="Contacts CRM indisponibles" text={crmResult.message} />}
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

async function CrmContactsPanel({ contacts }: { contacts: CrmContact[] }) {
  const agents = new Map<string, Awaited<ReturnType<typeof getAdminUserSummary>>>();
  await Promise.all(contacts.map(async (contact) => {
    if (contact.assigned_admin_user_id && !agents.has(contact.assigned_admin_user_id)) agents.set(contact.assigned_admin_user_id, await getAdminUserSummary(contact.assigned_admin_user_id));
  }));
  return <section className={styles.infoPanel} data-wide><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>CRM interne</p><h2>Fiches contacts ({contacts.length})</h2><p>Contacts enregistrés par l’équipe, avec ou sans espace client.</p></div><Link className={styles.secondaryButton} href="/admin/clients/nouveau"><Plus size={18}/>Nouveau contact</Link></div>{contacts.length ? <div className={styles.tablePanel}><table><thead><tr><th>Contact</th><th>Coordonnées</th><th>Agent responsable</th><th>Espace client</th><th aria-label="Détail"/></tr></thead><tbody>{contacts.map((contact) => { const agent = contact.assigned_admin_user_id ? agents.get(contact.assigned_admin_user_id) : null; return <tr key={contact.id}><td><strong>{contact.first_name} {contact.last_name}</strong><small>Fiche CRM interne</small></td><td><strong>{contact.email || "E-mail non renseigné"}</strong><small>{contact.phone || "Téléphone non renseigné"}</small></td><td><strong>{agent?.full_name ?? "Non attribué"}</strong><small>{agent?.email ?? "—"}</small></td><td><span className={styles.statusBadge} data-status={contact.linked_client_account_id ? "matched" : "paused"}>{contact.linked_client_account_id ? "Compte rattaché" : "CRM uniquement"}</span></td><td><Link className={styles.iconLink} href={`/admin/clients/crm/${contact.id}`}><ArrowRight size={18}/></Link></td></tr>; })}</tbody></table></div> : <p className={styles.mutedText}>Aucune fiche CRM. Ajoutez le premier contact de l’équipe.</p>}</section>;
}

function AdminFrame({ children, session }: { children: React.ReactNode; session: AdminSession }) {
  return (
    <main className={styles.adminPage}>
      <AdminSidebar active="/admin/clients" session={session}/>
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
                    <small>Origine : {formatAdminAttribution(client.first_attribution)}</small>
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
