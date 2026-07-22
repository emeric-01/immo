import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Euro,
  Home,
  HeartHandshake,
  LogOut,
  MapPin,
  Plus,
  Search,
} from "lucide-react";
import { propertyTypeLabels } from "@/lib/buyer-search/options";
import { requireClientSession } from "@/lib/client-access/auth";
import { getClientEstimations } from "@/lib/client-access/estimations";
import { getClientBuyerSearches } from "@/lib/client-access/project";
import { getClientReferrals } from "@/lib/client-access/referrals";
import { formatReferralProjectKind, formatReferralPropertyType, formatReferralStatus } from "@/lib/referrals";
import { logoutClient } from "./login/actions";
import { DeleteSearchButton } from "./DeleteSearchButton";
import styles from "./client.module.css";

export const metadata: Metadata = {
  title: "Mon espace | Les Jumelles Immo",
};

export const dynamic = "force-dynamic";

export default async function ClientDashboardPage() {
  const session = await requireClientSession();
  const [searches, estimations, referrals] = await Promise.all([
    getClientBuyerSearches(session),
    getClientEstimations(session),
    getClientReferrals(session),
  ]);

  return (
    <main className={styles.clientPage}>
      <section className={styles.shell}>
        <ClientHeader name={session.firstName} />

        <section className={styles.dashboardHero}>
          <div>
            <p className={styles.eyebrow}>Espace client</p>
            <h1>Bonjour {session.firstName || ""}</h1>
            <p>Retrouvez vos projets immobiliers et leurs dernières informations au même endroit.</p>
          </div>
          <div className={styles.dashboardActions}>
            <Link className={styles.primaryButton} href="/recherche?source=client">
              <Plus size={18} aria-hidden="true" />
              Nouvelle recherche
            </Link>
            <Link className={styles.secondaryButton} href="/">
              <BarChart3 size={18} aria-hidden="true" />
              Nouvelle estimation
            </Link>
            <Link className={styles.secondaryButton} href="/parrainage?source=client">
              <HeartHandshake size={18} aria-hidden="true" />
              Parrainer un proche
            </Link>
          </div>
        </section>

        <section className={styles.statsBand} aria-label="Vue globale">
          <div>
            <Search size={20} aria-hidden="true" />
            <strong>{searches.length}</strong>
            <span>Recherche{searches.length > 1 ? "s" : ""}</span>
          </div>
          <div>
            <BarChart3 size={20} aria-hidden="true" />
            <strong>{estimations.length}</strong>
            <span>Estimation{estimations.length > 1 ? "s" : ""}</span>
          </div>
          <div>
            <HeartHandshake size={20} aria-hidden="true" />
            <strong>{referrals.length}</strong>
            <span>Parrainage{referrals.length > 1 ? "s" : ""}</span>
          </div>
        </section>

        <section className={styles.dashboardSection}>
          <div className={styles.sectionTitle}>
            <div>
              <p className={styles.eyebrow}>Mes projets d&apos;achat</p>
              <h2>Mes recherches</h2>
            </div>
            <Link href="/recherche?source=client">Ajouter une recherche</Link>
          </div>
          {searches.length > 0 ? (
            <div className={styles.projectList}>
              {searches.map((search) => (
                <article className={styles.projectCard} key={search.id}>
                  <div className={styles.projectCardMain}>
                    <span className={styles.metricIcon}><Home size={20} aria-hidden="true" /></span>
                    <div>
                      <small>Recherche du {formatDate(search.created_at)}</small>
                      <h3>{formatPropertyTypes(search.property_types)}</h3>
                      <p><MapPin size={15} aria-hidden="true" /> {search.location_summary || "Localisation non renseignée"}</p>
                    </div>
                  </div>
                  <div className={styles.projectMeta}>
                    <span><Euro size={15} aria-hidden="true" /> {formatCurrency(search.maximum_budget)}</span>
                    {search.market_score !== null ? (
                      <span className={styles.scorePill}>{search.market_score}/100</span>
                    ) : null}
                  </div>
                  <div className={styles.projectActions}>
                    <DeleteSearchButton searchId={search.id} />
                    <Link className={styles.iconLink} href={`/client/recherches/${search.id}`} aria-label="Voir la recherche">
                      <ArrowRight size={20} aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptySection icon={Search} title="Aucune recherche" text="Créez votre première recherche acheteur depuis votre espace." href="/recherche?source=client" />
          )}
        </section>

        <section className={styles.dashboardSection}>
          <div className={styles.sectionTitle}>
            <div>
              <p className={styles.eyebrow}>Mes biens</p>
              <h2>Mes estimations</h2>
            </div>
            <Link href="/">Lancer une estimation</Link>
          </div>
          {estimations.length > 0 ? (
            <div className={styles.projectList}>
              {estimations.map((estimation) => (
                <article className={styles.projectCard} key={estimation.id}>
                  <div className={styles.projectCardMain}>
                    <span className={styles.metricIcon}><Building2 size={20} aria-hidden="true" /></span>
                    <div>
                      <small>Estimation du {formatDate(estimation.created_at)}</small>
                      <h3>{estimation.address_label}</h3>
                      <p>{estimation.property_type === "house" ? "Maison" : "Appartement"} · {estimation.surface_m2} m2 · {estimation.rooms} pièces</p>
                    </div>
                  </div>
                  <div className={styles.projectMeta}>
                    <strong>{formatCurrency(estimation.median_price)}</strong>
                    <span>{formatNumber(estimation.price_per_m2)} €/m2</span>
                  </div>
                  <Link className={styles.iconLink} href={`/client/estimations/${estimation.id}`} aria-label="Voir l'estimation">
                    <ArrowRight size={20} aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <EmptySection icon={BarChart3} title="Aucune estimation" text="Les estimations réalisées en étant connecté apparaîtront ici." href="/" />
          )}
        </section>

        <section className={styles.dashboardSection}>
          <div className={styles.sectionTitle}>
            <div>
              <p className={styles.eyebrow}>Mes recommandations</p>
              <h2>Mes parrainages</h2>
            </div>
            <Link href="/parrainage?source=client">Parrainer un proche</Link>
          </div>
          {referrals.length > 0 ? (
            <div className={styles.projectList}>
              {referrals.map((referral) => (
                <article className={styles.projectCard} key={referral.id}>
                  <div className={styles.projectCardMain}>
                    <span className={styles.metricIcon}><HeartHandshake size={20} aria-hidden="true" /></span>
                    <div>
                      <small>Parrainage du {formatDate(referral.created_at)}</small>
                      <h3>{referral.referred_first_name} {referral.referred_last_name}</h3>
                      <p>{formatReferralProjectKind(referral.project_kind)} · {formatReferralPropertyType(referral.property_type)} · {referral.property_city}</p>
                    </div>
                  </div>
                  <div className={styles.projectMeta}>
                    <span className={styles.referralStatus} data-status={referral.status}>
                      {formatReferralStatus(referral.status)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptySection icon={HeartHandshake} title="Aucun parrainage" text="Présentez-nous un proche et suivez ici l’avancement de sa recommandation." href="/parrainage?source=client" />
          )}
        </section>
      </section>
    </main>
  );
}

function ClientHeader({ name }: { name: string }) {
  return (
    <header className={styles.clientHeader}>
      <Link className={styles.brandMark} href="/client">
        <span>les jumelles</span>
        <strong>IMMO</strong>
      </Link>
      <div className={styles.accountMenu}>
        <span>{name || "Mon compte"}</span>
        <form action={logoutClient}>
          <button className={styles.iconButton} type="submit" title="Se déconnecter">
            <LogOut size={18} aria-hidden="true" />
          </button>
        </form>
      </div>
    </header>
  );
}

function EmptySection({ icon: Icon, title, text, href }: { icon: typeof Search; title: string; text: string; href: string }) {
  return (
    <div className={styles.sectionEmpty}>
      <Icon size={24} aria-hidden="true" />
      <div><strong>{title}</strong><p>{text}</p></div>
      <Link className={styles.secondaryButton} href={href}>Commencer</Link>
    </div>
  );
}

function formatPropertyTypes(types: Array<"house" | "apartment">) {
  return types.length > 0 ? types.map((type) => propertyTypeLabels[type]).join(" et ") : "Bien immobilier";
}

function formatCurrency(value: number | null) {
  return value
    ? new Intl.NumberFormat("fr-FR", { currency: "EUR", maximumFractionDigits: 0, style: "currency" }).format(value)
    : "Budget non renseigné";
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(value));
}
