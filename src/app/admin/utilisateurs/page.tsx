import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Plus, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { requireAdminSession } from "@/lib/admin/auth";
import { listAdminAttributionLinks, listAdminUsers } from "@/lib/admin/users";
import { requireAdminPermission } from "@/lib/admin/permissions";
import styles from "../admin.module.css";

export const metadata: Metadata = { title: "Utilisateurs admin | Les Jumelles Immo" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await requireAdminSession();
  await requireAdminPermission(session, "users:manage");
  const [users, links] = await Promise.all([listAdminUsers(), listAdminAttributionLinks()]);

  return (
    <main className={styles.detailPage}>
      <div className={styles.detailShell}>
        <Link className={styles.backLink} href="/admin/recherches"><ArrowLeft size={18} />Retour aux recherches</Link>
        <section className={styles.pageHeader}>
          <div><p className={styles.eyebrow}>Accès admin</p><h1>Utilisateurs</h1><p>Consultez les comptes puis ouvrez une fiche pour gérer ses accès.</p></div>
          <div className={styles.headerActions}>
            <div className={styles.sessionPill}><ShieldCheck size={18} />{session.fullName}</div>
            <Link className={styles.secondaryButton} href="/admin/utilisateurs/nouveau"><Plus size={18} />Nouvel utilisateur</Link>
          </div>
        </section>

        <section className={styles.userOverview}>
          <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Équipe</p><h2>Comptes actifs</h2></div>{users.status === "ready" ? <span className={styles.countPill}>{users.data.length} compte{users.data.length > 1 ? "s" : ""}</span> : null}</div>
          {users.status !== "ready" ? <p className={styles.mutedText}>{users.message}</p> : users.data.length ? (
            <div className={styles.userCardGrid}>
              {users.data.map((user) => {
                const attributionLink = links.status === "ready" ? links.data.find((link) => link.admin_user_id === user.id) : null;
                return (
                  <Link className={styles.userCard} href={`/admin/utilisateurs/${user.id}`} key={user.id}>
                    <span className={styles.userAvatar}><UserRound size={22} /></span>
                    <div className={styles.userCardBody}>
                      <div className={styles.userCardHeading}><strong>{user.full_name}</strong><span className={styles.statusBadge} data-status={user.is_active ? "matched" : "paused"}>{user.is_active ? "Actif" : "Désactivé"}</span></div>
                      <p>{user.email}</p>
                      <div className={styles.userCardMeta}><span>{formatRole(user.role)}</span>{attributionLink ? <span>ref={attributionLink.code}</span> : <span>Aucun lien</span>}</div>
                    </div>
                    <ArrowRight className={styles.userCardArrow} size={20} />
                  </Link>
                );
              })}
            </div>
          ) : <div className={styles.emptyState}><UsersRound size={24} /><h2>Aucun utilisateur</h2><p>Créez le premier accès à l’administration.</p></div>}
        </section>
      </div>
    </main>
  );
}

function formatRole(role: "admin" | "agent" | "editor" | "manager") {
  return { admin: "Administrateur", agent: "Agent commercial", editor: "Éditeur", manager: "Manager" }[role];
}
