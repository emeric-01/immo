import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, Euro, Home, Mail, MapPin, Phone, ShieldCheck, UserRound } from "lucide-react";
import type { ClientEstimationRow } from "@/lib/client-access/estimations";
import { requireAdminSession } from "@/lib/admin/auth";
import {
  formatAdminClientName,
  formatAdminClientPropertyTypes,
  getAdminClient,
  type AdminClientSearch,
} from "@/lib/admin/clients";
import styles from "../../admin.module.css";

export const metadata: Metadata = {
  title: "Detail client | Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminSession();
  const { id } = await params;
  const result = await getAdminClient(id);

  if (result.status !== "ready") {
    return (
      <DetailFrame>
        <section className={styles.emptyState}>
          <ShieldCheck size={26} aria-hidden="true" />
          <h1>Lecture BDD a finaliser</h1>
          <p>{result.message}</p>
        </section>
      </DetailFrame>
    );
  }

  if (!result.data) {
    return (
      <DetailFrame>
        <section className={styles.emptyState}>
          <h1>Client introuvable</h1>
          <p>Ce compte client n&apos;existe pas ou n&apos;est plus disponible.</p>
        </section>
      </DetailFrame>
    );
  }

  const { client, estimations, searches } = result.data;
  const latestSearch = searches[0] ?? null;

  return (
    <DetailFrame>
      <section className={styles.detailHero}>
        <Link className={styles.backLink} href="/admin/clients">
          <ArrowLeft size={18} aria-hidden="true" />
          Retour aux clients
        </Link>
        <div className={styles.detailHeroGrid}>
          <div>
            <p className={styles.eyebrow}>Compte client</p>
            <h1>{formatAdminClientName(client)}</h1>
            <p>{latestSearch?.location_summary || "Aucune demande rattachee pour le moment."}</p>
          </div>
          <div className={styles.contactBox}>
            <a href={`mailto:${client.email}`}>
              <Mail size={18} aria-hidden="true" />
              {client.email}
            </a>
            {client.phone ? (
              <a href={`tel:${client.phone.replace(/\s/g, "")}`}>
                <Phone size={18} aria-hidden="true" />
                {client.phone}
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section className={styles.detailGrid}>
        <InfoPanel title="Profil client">
          <Metric icon={UserRound} label="Nom" value={formatAdminClientName(client)} />
          <Metric icon={ShieldCheck} label="Acces espace client" value={client.access_enabled ? "Actif" : "Desactive"} />
          <Metric icon={CalendarDays} label="Creation" value={formatDate(client.created_at)} />
          <Metric icon={CalendarDays} label="Derniere mise a jour" value={formatDate(client.updated_at)} />
        </InfoPanel>

        <InfoPanel title="Derniere activite">
          <Metric icon={Home} label="Derniere recherche" value={latestSearch ? formatAdminClientPropertyTypes(latestSearch.property_types) : "Aucune"} />
          <Metric icon={MapPin} label="Secteur" value={latestSearch?.location_summary || "Non renseigne"} />
          <Metric icon={Euro} label="Budget maximum" value={formatCurrency(latestSearch?.maximum_budget)} />
          <Metric icon={ShieldCheck} label="Connexion client" value="Code temporaire par email" />
        </InfoPanel>

        <InfoPanel title={`Demandes liees (${searches.length})`} wide>
          {searches.length > 0 ? (
            <div className={styles.tablePanel}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Recherche</th>
                    <th>Budget</th>
                    <th>Statut</th>
                    <th aria-label="Detail" />
                  </tr>
                </thead>
                <tbody>
                  {searches.map((search) => (
                    <SearchRow key={search.id} search={search} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={styles.mutedText}>Aucune demande rattachee a ce client.</p>
          )}
        </InfoPanel>

        <InfoPanel title={`Estimations liees (${estimations.length})`} wide>
          {estimations.length > 0 ? (
            <div className={styles.tablePanel}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Bien</th>
                    <th>Surface</th>
                    <th>Valeur estimee</th>
                    <th aria-label="Detail" />
                  </tr>
                </thead>
                <tbody>
                  {estimations.map((estimation) => (
                    <EstimationRow estimation={estimation} key={estimation.id} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={styles.mutedText}>Aucune estimation rattachee a ce client.</p>
          )}
        </InfoPanel>
      </section>
    </DetailFrame>
  );
}

function EstimationRow({ estimation }: { estimation: ClientEstimationRow }) {
  return (
    <tr>
      <td><strong>{formatDate(estimation.created_at)}</strong><small>{estimation.source === "immo-data" ? "Immo Data" : "Démonstration"}</small></td>
      <td><strong>{estimation.property_type === "house" ? "Maison" : "Appartement"}</strong><small>{estimation.address_label}</small></td>
      <td><strong>{estimation.surface_m2} m2</strong><small>{estimation.rooms} pièces</small></td>
      <td><strong>{formatCurrency(estimation.median_price)}</strong><small>{estimation.price_per_m2.toLocaleString("fr-FR")} €/m2</small></td>
      <td><Link className={styles.iconLink} href={`/admin/estimations/${estimation.id}`}><ArrowRight size={18} aria-hidden="true" /></Link></td>
    </tr>
  );
}

function SearchRow({ search }: { search: AdminClientSearch }) {
  return (
    <tr>
      <td>
        <strong>{formatDate(search.created_at)}</strong>
        <small>{search.client_last_access_at ? `Dernier acces ${formatDate(search.client_last_access_at)}` : "Pas encore consulte"}</small>
      </td>
      <td>
        <strong>{formatAdminClientPropertyTypes(search.property_types)}</strong>
        <small>{search.location_summary || "Secteur non renseigne"}</small>
      </td>
      <td>
        <strong>{formatCurrency(search.maximum_budget)}</strong>
        <small>{search.minimum_living_area ? `${search.minimum_living_area} m2 min.` : "Surface non renseignee"}</small>
      </td>
      <td>
        <span className={styles.statusBadge} data-status={search.status}>
          {formatStatus(search.status)}
        </span>
      </td>
      <td>
        <Link className={styles.iconLink} href={`/admin/recherches/${search.id}`}>
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </td>
    </tr>
  );
}

function DetailFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className={styles.detailPage}>
      <div className={styles.detailShell}>{children}</div>
    </main>
  );
}

function InfoPanel({ children, title, wide }: { children: React.ReactNode; title: string; wide?: boolean }) {
  return (
    <article className={styles.infoPanel} data-wide={wide || undefined}>
      <h2>{title}</h2>
      {children}
    </article>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Home; label: string; value: string }) {
  return (
    <div className={styles.metricRow}>
      <span>
        <Icon size={18} aria-hidden="true" />
      </span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
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
    }[status] ?? status
  );
}
