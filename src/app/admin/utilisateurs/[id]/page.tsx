import Link from "next/link";
import { ArrowLeft, Link2, Mail, ShieldCheck, UserRound } from "lucide-react";
import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/admin/auth";
import { defaultPermissionsByRole, type AdminPermission } from "@/lib/admin/permission-definitions";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { listAdminAttributionLinks, listAdminUserPermissions, listAdminUsers } from "@/lib/admin/users";
import { AdminUserPermissionsForm } from "../AdminUserPermissionsForm";
import styles from "../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  await requireAdminPermission(session, "users:manage");
  const { id } = await params;
  const [users, links, permissionRows] = await Promise.all([listAdminUsers(), listAdminAttributionLinks(), listAdminUserPermissions()]);
  if (users.status !== "ready") throw new Error(users.message);
  const user = users.data.find((item) => item.id === id);
  if (!user) notFound();
  const link = links.status === "ready" ? links.data.find((item) => item.admin_user_id === user.id) : null;
  const explicitPermissions = permissionRows.status === "ready" ? permissionRows.data.filter((row) => row.admin_user_id === user.id) : [];
  const permissions = explicitPermissions.length ? explicitPermissions.filter((row) => row.is_allowed).map((row) => row.permission) : defaultPermissionsByRole[user.role] as AdminPermission[];

  return <main className={styles.detailPage}><div className={styles.detailShell}>
    <Link className={styles.backLink} href="/admin/utilisateurs"><ArrowLeft size={18}/>Retour aux utilisateurs</Link>
    <section className={styles.detailHero}><div className={styles.detailHeroGrid}><div><p className={styles.eyebrow}>Fiche utilisateur</p><h1>{user.full_name}</h1><p>{formatRole(user.role)} · {user.is_active ? "Compte actif" : "Compte désactivé"}</p></div><span className={styles.userAvatar}><UserRound size={26}/></span></div></section>
    <section className={styles.detailGrid}>
      <article className={styles.infoPanel}><h2>Informations du compte</h2><Metric icon={Mail} label="E-mail" value={user.email}/><Metric icon={ShieldCheck} label="Rôle" value={formatRole(user.role)}/><Metric icon={ShieldCheck} label="Statut" value={user.is_active ? "Actif" : "Désactivé"}/></article>
      <article className={styles.infoPanel}><h2>Lien d’attribution</h2><Metric icon={Link2} label="Code" value={link?.code ?? "Aucun code"}/>{link ? <a className={styles.secondaryButton} href={`https://jumellesimmo.fr/?ref=${link.code}`} rel="noreferrer" target="_blank">Ouvrir le lien</a> : null}</article>
      <article className={styles.infoPanel} data-wide><h2>Menus et actions autorisés</h2>{user.role === "admin" ? <div className={styles.noticeBox}><ShieldCheck size={18}/><p>Un administrateur dispose automatiquement de tous les accès.</p></div> : <AdminUserPermissionsForm initialPermissions={permissions} userId={user.id}/>}</article>
    </section>
  </div></main>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof UserRound; label: string; value: string }) { return <div className={styles.metricRow}><span><Icon size={18}/></span><div><small>{label}</small><strong>{value}</strong></div></div>; }
function formatRole(role: "admin" | "agent" | "editor" | "manager") { return { admin: "Administrateur", agent: "Agent commercial", editor: "Éditeur", manager: "Manager" }[role]; }
