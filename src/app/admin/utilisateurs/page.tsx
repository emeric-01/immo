import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, UsersRound } from "lucide-react";
import { requireAdminSession } from "@/lib/admin/auth";
import { defaultPermissionsByRole, type AdminPermission } from "@/lib/admin/permission-definitions";
import { listAdminAttributionLinks, listAdminUserPermissions, listAdminUsers } from "@/lib/admin/users";
import { requireAdminPermission } from "@/lib/admin/permissions";
import styles from "../admin.module.css";
import { CreateAdminUserForm } from "./CreateAdminUserForm";
import { AdminUserPermissionsForm } from "./AdminUserPermissionsForm";

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
  await requireAdminPermission(session, "users:manage");
  const params = await searchParams;
  const users = await listAdminUsers();
  const links = await listAdminAttributionLinks();
  const permissionRows = await listAdminUserPermissions();

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
            {params.created ? <p className={styles.successText}>Utilisateur créé.</p> : null}
            {params.error ? <p className={styles.errorText}>{params.error}</p> : null}
            <CreateAdminUserForm />
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
                      {links.status === "ready" ? links.data.filter((link) => link.admin_user_id === user.id).map((link) => (
                        <small key={link.id}>Lien : {`https://jumellesimmo.fr${link.landing_path}?ref=${link.code}`}</small>
                      )) : null}
                      {user.role !== "admin" ? (
                        <AdminUserPermissionsForm
                          initialPermissions={permissionRows.status === "ready" && permissionRows.data.some((row) => row.admin_user_id === user.id)
                            ? permissionRows.data.filter((row) => row.admin_user_id === user.id && row.is_allowed).map((row) => row.permission)
                            : defaultPermissionsByRole[user.role] as AdminPermission[]}
                          userId={user.id}
                        />
                      ) : <small>Un administrateur dispose de tous les accès.</small>}
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
