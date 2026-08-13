import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { requireAdminSession } from "@/lib/admin/auth";
import { getCrmContact, isOwnCrmContact } from "@/lib/admin/crm-contacts";
import { hasAdminPermission, requireAdminPermission } from "@/lib/admin/permissions";
import { listAdminUsers } from "@/lib/admin/users";
import { updateCrmContactAction } from "../../../actions";
import styles from "../../../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function EditCrmContactPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const session = await requireAdminSession(); await requireAdminPermission(session, "clients:read");
  const [{ id }, query, users] = await Promise.all([params, searchParams, listAdminUsers()]);
  const result = await getCrmContact(id, session); if (result.status !== "ready" || !result.data) notFound();
  const contact = result.data.contact;
  if (session.role === "agent" && (!(await hasAdminPermission(session, "crm_contacts:update_own")) || !isOwnCrmContact(contact, session))) notFound();
  const agents = users.status === "ready" ? users.data.filter((user) => user.is_active && user.role === "agent") : [];
  return <main className={styles.adminPage}><AdminSidebar active="/admin/clients" session={session}/><section className={styles.content}>
    <Link className={styles.backLink} href={`/admin/clients/crm/${id}`}><ArrowLeft size={18}/>Retour à la fiche</Link>
    <header className={styles.pageHeader}><div><p className={styles.eyebrow}>CRM interne</p><h1>Modifier {contact.first_name} {contact.last_name}</h1></div></header>
    <section className={styles.infoPanel} data-wide>{query.error ? <p className={styles.errorText} role="alert">{query.error}</p> : null}<form action={updateCrmContactAction} className={styles.userForm}>
      <input name="id" type="hidden" value={id}/><label htmlFor="firstName">Prénom</label><input defaultValue={contact.first_name} id="firstName" name="firstName" required/>
      <label htmlFor="lastName">Nom</label><input defaultValue={contact.last_name} id="lastName" name="lastName" required/>
      <label htmlFor="email">E-mail</label><input defaultValue={contact.email} id="email" name="email" required type="email"/>
      <label htmlFor="phone">Téléphone</label><input defaultValue={contact.phone} id="phone" name="phone" type="tel"/>
      {session.role !== "agent" ? <><label htmlFor="assignedAdminUserId">Agent responsable</label><select defaultValue={contact.assigned_admin_user_id ?? ""} id="assignedAdminUserId" name="assignedAdminUserId"><option value="">Non attribué</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.full_name}</option>)}</select></> : null}
      <label htmlFor="status">Statut</label><select defaultValue={contact.status} id="status" name="status"><option value="prospect">Prospect</option><option value="active">Actif</option><option value="archived">Archivé</option></select>
      <label htmlFor="notes">Notes internes</label><textarea defaultValue={contact.notes} id="notes" name="notes" rows={5}/><button type="submit"><Save size={18}/>Enregistrer</button>
    </form></section>
  </section></main>;
}
