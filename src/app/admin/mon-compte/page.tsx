import type { Metadata } from "next";
import { ShieldCheck, UserRound } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { requireAdminSession } from "@/lib/admin/auth";
import { listAdminAttributionLinks } from "@/lib/admin/users";
import admin from "../admin.module.css";
import { CopyLinkButton } from "../mes-liens/CopyLinkButton";
import styles from "./account.module.css";
import { PasswordChangeForm } from "./PasswordChangeForm";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = { title: "Mon compte | Admin Les Jumelles Immo" };
export const dynamic = "force-dynamic";

const roleLabels = { admin: "Administrateur", agent: "Agent commercial", bootstrap: "Accès bootstrap", editor: "Éditeur", manager: "Manager" };

export default async function AdminAccountPage() {
  const session = await requireAdminSession();
  const links = session.role === "bootstrap" ? null : await listAdminAttributionLinks(session.id);
  const activeLinks = links?.status === "ready" ? links.data.filter((link) => link.is_active).slice(0, 1) : [];

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
              const shareUrl = `https://jumellesimmo.fr${link.landing_path}?ref=${link.code}`;
              return <article className={styles.linkCard} key={link.id}>
                <div className={styles.linkLabel}><ShieldCheck size={16}/>{link.label}</div>
                <h3>Lien à partager</h3>
                <div className={styles.urlLine}><code>{shareUrl}</code><CopyLinkButton value={shareUrl}/></div>
                <small>Les paramètres de suivi sont appliqués automatiquement depuis votre code d’affiliation.</small>
              </article>;
            })}</div> : <p className={styles.accountNotice}>Aucun lien actif n’est encore rattaché à ce compte. Un administrateur peut recréer le lien depuis la gestion des utilisateurs.</p>}
          </section>
        </div>
      </section>
    </main>
  );
}
