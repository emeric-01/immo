import Link from "next/link";
import { ArrowLeft, Info, UserPlus } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { requireAdminSession } from "@/lib/admin/auth";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { listAdminUsers } from "@/lib/admin/users";
import { createCrmContactAction } from "../actions";
import styles from "../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function NewCrmContactPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await requireAdminSession();
  await requireAdminPermission(session, "clients:read");
  const [params, users] = await Promise.all([searchParams, listAdminUsers()]);
  const agents = users.status === "ready" ? users.data.filter((user) => user.is_active && user.role === "agent") : [];

  return <main className={styles.adminPage}>
    <AdminSidebar active="/admin/clients" session={session}/>
    <section className={styles.content}>
      <Link className={styles.backLink} href="/admin/clients"><ArrowLeft size={18}/>Retour aux contacts</Link>
      <header className={styles.pageHeader}><div><p className={styles.eyebrow}>CRM interne</p><h1>Ajouter un contact</h1><p>Créez une fiche commerciale sans ouvrir d’espace client.</p></div></header>
      <section className={styles.infoPanel} data-wide>
        <div className={styles.noticeBox}><Info size={18}/><strong>Informations uniquement enregistrées dans le CRM.</strong><p>Aucun compte, aucune notification et aucun e-mail ne seront envoyés au contact. Pour créer un accès client, contactez l’administrateur.</p></div>
        {params.error ? <p className={styles.errorText} role="alert">{params.error}</p> : null}
        <form action={createCrmContactAction} className={styles.userForm}>
          <label htmlFor="firstName">Prénom</label><input id="firstName" name="firstName" required />
          <label htmlFor="lastName">Nom</label><input id="lastName" name="lastName" required />
          <label htmlFor="email">E-mail</label><input autoComplete="email" id="email" name="email" required type="email" />
          <label htmlFor="phone">Téléphone <small>(facultatif)</small></label><input id="phone" name="phone" type="tel" />
          {session.role !== "agent" ? <><label htmlFor="assignedAdminUserId">Agent commercial responsable <small>(facultatif)</small></label><select defaultValue="" id="assignedAdminUserId" name="assignedAdminUserId"><option value="">Non attribué</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.full_name}</option>)}</select></> : null}
          <label htmlFor="notes">Notes internes <small>(facultatif)</small></label><textarea id="notes" name="notes" rows={5}/>
          <button type="submit"><UserPlus size={18}/>Créer la fiche CRM</button>
        </form>
      </section>
    </section>
  </main>;
}
