import type { Metadata } from "next";
import { Calculator, ExternalLink, HeartHandshake, Search, ShieldCheck, UserRound } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { requireAdminSession } from "@/lib/admin/auth";
import { listAdminAttributionLinks } from "@/lib/admin/users";
import { getSiteUrl } from "@/lib/site";
import admin from "../admin.module.css";
import { CopyLinkButton } from "../mes-liens/CopyLinkButton";
import styles from "./account.module.css";
import { PasswordChangeForm } from "./PasswordChangeForm";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = { title: "Mon compte | Admin Les Jumelles Immo" };
export const dynamic = "force-dynamic";

const roleLabels = { admin: "Administrateur", agent: "Agent commercial", bootstrap: "Accès bootstrap", editor: "Éditeur", manager: "Manager" };
const publicLinkTargets = [
  { description: "Pour déposer un projet d’achat", icon: Search, label: "Recherche", path: "/recherche" },
  { description: "Pour obtenir une première estimation", icon: Calculator, label: "Estimation", path: "/estimation" },
  { description: "Pour recommander un proche", icon: HeartHandshake, label: "Parrainage", path: "/parrainage" },
] as const;

export default async function AdminAccountPage() {
  const session = await requireAdminSession();
  const links = session.role === "bootstrap" ? null : await listAdminAttributionLinks(session.id);
  const activeLinks = links?.status === "ready" ? links.data.filter((link) => link.is_active).slice(0, 1) : [];
  const publicSiteUrl = getSiteUrl();

  return (
    <main className={admin.adminPage}>
      <AdminSidebar active="/admin/mon-compte" session={session}/>
      <section className={admin.content}>
        <header className={admin.pageHeader}><div><p className={admin.eyebrow}>Espace personnel</p><h1>Mon compte</h1><p>Retrouvez vos liens de suivi et gérez la sécurité de votre accès.</p></div></header>
        <div className={styles.profileGrid}>
          <section className={styles.panel}>
            <div className={styles.identity}><span><UserRound size={21}/></span><div><strong>{session.fullName}</strong><small>{session.email}</small></div></div>
            <span className={styles.roleBadge}>{roleLabels[session.role]}</span>
            <h2>Informations personnelles</h2>
            <ProfileForm disabled={session.role === "bootstrap"} email={session.email} fullName={session.fullName}/>
            <h2>Sécurité du compte</h2>
            <p>Votre mot de passe protège les données clients et les informations commerciales accessibles depuis le back-office.</p>
            <PasswordChangeForm disabled={session.role === "bootstrap"}/>
          </section>
          <section className={styles.panel}>
            <div><p className={admin.eyebrow}>Attribution</p><h2>Mes liens d’affiliation</h2></div>
            <p>Les recherches, estimations et créations de compte réalisées après un clic sur ces liens vous sont automatiquement rattachées.</p>
            {activeLinks.length ? <div className={styles.links}>{activeLinks.map((link) => {
              return <article className={styles.linkCard} key={link.id}>
                <div className={styles.linkLabel}><ShieldCheck size={16}/>{link.label}</div>
                <h3>Liens à partager</h3>
                <div className={styles.destinationGrid}>
                  {publicLinkTargets.map((target) => {
                    const Icon = target.icon;
                    const shareUrl = `${publicSiteUrl}${target.path}?ref=${encodeURIComponent(link.code)}`;
                    return <section className={styles.destinationCard} key={target.path}>
                      <div className={styles.destinationHeader}>
                        <span className={styles.destinationIcon}><Icon size={18}/></span>
                        <div><strong>{target.label}</strong><small>{target.description}</small></div>
                        <a aria-label={`Ouvrir le lien ${target.label}`} href={shareUrl} rel="noreferrer" target="_blank"><ExternalLink size={17}/></a>
                      </div>
                      <div className={styles.urlLine}><code>{shareUrl}</code><CopyLinkButton value={shareUrl}/></div>
                    </section>;
                  })}
                </div>
                <small>Votre référence <strong>{link.code}</strong> est ajoutée automatiquement à chacun de ces liens.</small>
              </article>;
            })}</div> : <p className={styles.accountNotice}>Aucun lien actif n’est encore rattaché à ce compte. Un administrateur peut recréer le lien depuis la gestion des utilisateurs.</p>}
          </section>
        </div>
      </section>
    </main>
  );
}
