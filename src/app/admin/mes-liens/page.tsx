import type { Metadata } from "next";
import Link from "next/link";
import { Link2 } from "lucide-react";
import { requireAdminSession } from "@/lib/admin/auth";
import { listAdminAttributionLinks } from "@/lib/admin/users";
import styles from "../admin.module.css";
import { CopyLinkButton } from "./CopyLinkButton";

export const metadata: Metadata = { title: "Mes liens de suivi | Admin" };
export const dynamic = "force-dynamic";

export default async function MyTrackingLinksPage() {
  const session = await requireAdminSession();
  const links = await listAdminAttributionLinks(session.role === "admin" || session.role === "bootstrap" ? undefined : session.id);
  return <main className={styles.detailPage}><div className={styles.detailShell}>
    <Link className={styles.backLink} href="/admin/recherches">Retour au tableau de bord</Link>
    <section className={styles.pageHeader}><div><p className={styles.eyebrow}>Attribution</p><h1>Mes liens de suivi</h1><p>Partagez ces liens. Les estimations, recherches et comptes créés ensuite vous seront automatiquement rattachés.</p></div></section>
    <section className={styles.infoPanel}><h2>Liens actifs</h2>
      {links.status === "ready" && links.data.length ? <div className={styles.userList}>{links.data.map((link) => {
        const url = `https://jumellesimmo.fr${link.landing_path}?ref=${link.code}&utm_source=${link.utm_source}&utm_medium=${link.utm_medium}&utm_campaign=${link.utm_campaign}`;
        return <div key={link.id}><span><Link2 size={18}/></span><div><strong>{link.label}</strong><small>{url}</small></div><CopyLinkButton value={url}/></div>;
      })}</div> : <p>Aucun lien actif. Un lien est généré automatiquement lors de la création d’un compte agent.</p>}
    </section>
  </div></main>;
}
