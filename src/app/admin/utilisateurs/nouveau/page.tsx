import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import { requireAdminSession } from "@/lib/admin/auth";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { CreateAdminUserForm } from "../CreateAdminUserForm";
import styles from "../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function NewAdminUserPage() {
  const session = await requireAdminSession();
  await requireAdminPermission(session, "users:manage");
  return <main className={styles.detailPage}><div className={styles.detailShell}>
    <Link className={styles.backLink} href="/admin/utilisateurs"><ArrowLeft size={18}/>Retour aux utilisateurs</Link>
    <section className={styles.detailHero}><div className={styles.detailHeroGrid}><div><p className={styles.eyebrow}>Accès admin</p><h1>Nouvel utilisateur</h1><p>Créez le compte, son rôle et ses autorisations.</p></div><span className={styles.userAvatar}><UserPlus size={24}/></span></div></section>
    <section className={styles.infoPanel}><CreateAdminUserForm /></section>
  </div></main>;
}
