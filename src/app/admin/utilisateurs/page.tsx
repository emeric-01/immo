import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, UserPlus, UsersRound } from "lucide-react";
import { requireAdminSession } from "@/lib/admin/auth";
import { listAdminUsers } from "@/lib/admin/users";
import styles from "../admin.module.css";
import { createAdminUserAction } from "./actions";

export const metadata: Metadata = {
  title: "Utilisateurs admin | Les Jumelles Immo",
};

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  const session = await requireAdminSession();
  const params = await searchParams;
  const users = await listAdminUsers();

  return (
    <main className={styles.detailPage}>
      <div className={styles.detailShell}>
        <Link className={styles.backLink} href="/admin/recherches">
          <ArrowLeft size={18} aria-hidden="true" />
          Retour aux recherches
        </Link>
        <section className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>Acces admin</p>
            <h1>Utilisateurs</h1>
            <p>Ajoutez les personnes qui peuvent consulter les formulaires enregistres.</p>
          </div>
          <div className={styles.sessionPill}>
            <ShieldCheck size={18} aria-hidden="true" />
            {session.fullName}
          </div>
        </section>

        <section className={styles.userGrid}>
          <article className={styles.infoPanel}>
            <h2>Nouvel utilisateur</h2>
            {params.created ? <p className={styles.successText}>Utilisateur cree.</p> : null}
            {params.error ? <p className={styles.errorText}>{params.error}</p> : null}
            <form action={createAdminUserAction} className={styles.userForm}>
              <label htmlFor="fullName">Nom</label>
              <input id="fullName" name="fullName" placeholder="Claire Dupont" />
              <label htmlFor="email">Email</label>
              <input id="email" name="email" placeholder="claire@lesjumelles.immo" required type="email" />
              <label htmlFor="password">Mot de passe provisoire</label>
              <input id="password" minLength={10} name="password" required type="password" />
              <label htmlFor="role">Role</label>
              <select id="role" name="role" defaultValue="manager">
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
              <button type="submit">
                <UserPlus size={18} aria-hidden="true" />
                Creer l&apos;acces
              </button>
            </form>
          </article>

          <article className={styles.infoPanel}>
            <h2>Comptes actifs</h2>
            {users.status !== "ready" ? (
              <p className={styles.mutedText}>{users.message}</p>
            ) : users.data.length > 0 ? (
              <div className={styles.userList}>
                {users.data.map((user) => (
                  <div key={user.id}>
                    <span>
                      <UsersRound size={18} aria-hidden="true" />
                    </span>
                    <div>
                      <strong>{user.full_name}</strong>
                      <small>
                        {user.email} - {user.role} - {user.is_active ? "actif" : "desactive"}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.mutedText}>Aucun utilisateur en base pour le moment.</p>
            )}
          </article>
        </section>
      </div>
    </main>
  );
}
