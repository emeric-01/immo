import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Gift, HeartHandshake, Inbox, Search, UserRoundCheck } from "lucide-react";
import { requireAdminSession } from "@/lib/admin/auth";
import { getAdminReferrals, getAdminReferralStats, type AdminReferral } from "@/lib/admin/referrals";
import { formatReferralProjectKind, formatReferralPropertyType, formatReferralStatus, referralStatuses } from "@/lib/referrals";
import { logoutAdmin } from "../login/actions";
import styles from "../admin.module.css";

export const metadata: Metadata = { title: "Parrainages | Admin" };
export const dynamic = "force-dynamic";

export default async function AdminReferralsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  await requireAdminSession();
  const params = await searchParams;
  const result = await getAdminReferrals(params);

  return (
    <main className={styles.adminPage}>
      <AdminSidebar />
      <section className={styles.content}>
        <section className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>Programme ambassadeur</p>
            <h1>Parrainages immobiliers</h1>
            <p>Tous les parrainages restent visibles, qu’ils soient liés ou non à un compte client.</p>
          </div>
          <form action={logoutAdmin}><button className={styles.secondaryButton} type="submit">Deconnexion</button></form>
        </section>

        {result.status !== "ready" ? (
          <EmptyState title="Lecture BDD a finaliser" text={result.message} />
        ) : (
          <>
            <ReferralStats referrals={result.data} />
            <form className={styles.filterBar}>
              <label className={styles.searchField}>
                <Search aria-hidden="true" size={18} />
                <input defaultValue={params.q ?? ""} name="q" placeholder="Rechercher parrain, filleul, email, téléphone, ville..." />
              </label>
              <select defaultValue={params.status ?? "all"} name="status">
                <option value="all">Tous les statuts</option>
                {referralStatuses.map((status) => <option key={status} value={status}>{formatReferralStatus(status)}</option>)}
              </select>
              <button type="submit">Filtrer</button>
            </form>
            {result.data.length ? <ReferralTable referrals={result.data} /> : <EmptyState title="Aucun parrainage" text="Aucun dossier ne correspond aux filtres actuels." />}
          </>
        )}
      </section>
    </main>
  );
}

function AdminSidebar() {
  return <aside className={styles.sidebar}><div className={styles.brandMark}><span>les jumelles</span><strong>IMMO</strong></div><nav><Link href="/admin/biens">Biens</Link><Link href="/admin/recherches">Recherches</Link><Link href="/admin/estimations">Estimations</Link><Link data-active href="/admin/parrainages">Parrainages</Link><Link href="/admin/clients">Clients</Link><Link href="/admin/recherches-villes">Villes recherchées</Link><Link href="/admin/audience">Audience</Link><Link href="/admin/contenus">Contenus</Link><Link href="/admin/utilisateurs">Utilisateurs</Link></nav></aside>;
}

function ReferralStats({ referrals }: { referrals: AdminReferral[] }) {
  const stats = getAdminReferralStats(referrals);
  const cards = [
    { icon: HeartHandshake, label: "Parrainages", value: stats.total },
    { icon: Inbox, label: "A traiter", value: stats.newCount },
    { icon: CheckCircle2, label: "Transactions", value: stats.signedCount },
    { icon: Gift, label: "Primes versées", value: stats.rewardedCount },
    { icon: UserRoundCheck, label: "Comptes liés", value: stats.linkedCount },
  ];
  return <div className={styles.statsGrid}>{cards.map((card) => <article className={styles.statCard} key={card.label}><span><card.icon aria-hidden="true" size={18} /></span><p>{card.label}</p><strong>{card.value}</strong></article>)}</div>;
}

function ReferralTable({ referrals }: { referrals: AdminReferral[] }) {
  return <div className={styles.tablePanel}><table><thead><tr><th>Parrain</th><th>Proche présenté</th><th>Projet</th><th>Statut</th><th>Compte</th><th>Date</th><th aria-label="Détail" /></tr></thead><tbody>{referrals.map((referral) => <tr key={referral.id}><td><strong>{referral.sponsor_first_name} {referral.sponsor_last_name}</strong><small>{referral.sponsor_email}</small><small>{referral.sponsor_phone}</small></td><td><strong>{referral.referred_first_name} {referral.referred_last_name}</strong><small>{referral.referred_phone}</small></td><td><strong>{formatReferralProjectKind(referral.project_kind)} · {formatReferralPropertyType(referral.property_type)}</strong><small>{referral.property_city}</small></td><td><span className={styles.statusBadge} data-status={referral.status}>{formatReferralStatus(referral.status)}</span></td><td>{referral.sponsor_client_account_id ? <Link href={`/admin/clients/${referral.sponsor_client_account_id}`}>Compte lié</Link> : <small>Sans compte</small>}</td><td><strong>{formatDate(referral.created_at)}</strong></td><td><Link aria-label="Voir le parrainage" className={styles.iconLink} href={`/admin/parrainages/${referral.id}`}><ArrowRight aria-hidden="true" size={18} /></Link></td></tr>)}</tbody></table></div>;
}

function EmptyState({ title, text }: { title: string; text: string }) { return <section className={styles.emptyState}><Inbox aria-hidden="true" size={26} /><h2>{title}</h2><p>{text}</p></section>; }
function formatDate(value: string) { return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
