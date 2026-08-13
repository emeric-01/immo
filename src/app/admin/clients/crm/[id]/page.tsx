import Link from "next/link";
import { AlertTriangle, ArrowLeft, ArrowRight, Building2, Calculator, Link2, Mail, Pencil, Phone, Search, ShieldCheck, UserRound } from "lucide-react";
import { requireAdminSession } from "@/lib/admin/auth";
import { hasAdminPermission, requireAdminPermission } from "@/lib/admin/permissions";
import { getCrmContact, isOwnCrmContact } from "@/lib/admin/crm-contacts";
import { getAdminUserSummary } from "@/lib/admin/users";
import styles from "../../../admin.module.css";
import { DeleteCrmContactButton } from "./DeleteCrmContactButton";

export const dynamic = "force-dynamic";

type PageParams = { created?: string; estimationCreated?: string; estimationError?: string; searchCreated?: string; searchError?: string };

export default async function CrmContactDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<PageParams> }) {
  const session = await requireAdminSession();
  await requireAdminPermission(session, "clients:read");
  const [{ id }, feedback] = await Promise.all([params, searchParams]);
  const result = await getCrmContact(id, session);
  if (result.status !== "ready" || !result.data) return <main className={styles.detailPage}><div className={styles.detailShell}><Link className={styles.backLink} href="/admin/clients"><ArrowLeft size={18}/>Retour aux contacts</Link><section className={styles.emptyState}><h1>Fiche CRM indisponible</h1><p>{result.status === "ready" ? "Cette fiche n’existe pas." : result.message}</p></section></div></main>;
  const { clientAccount, clientEstimations, clientSearches, contact, internalEstimations, internalSearches } = result.data;
  const agent = await getAdminUserSummary(contact.assigned_admin_user_id);
  const ownsContact = isOwnCrmContact(contact, session);
  const canEdit = session.role !== "agent" || (ownsContact && await hasAdminPermission(session, "crm_contacts:update_own"));
  const canDelete = session.role !== "agent" || (contact.created_by_admin_user_id === session.id && await hasAdminPermission(session, "crm_contacts:delete_own"));

  return <main className={styles.detailPage}><div className={styles.detailShell}>
    <div className={styles.detailTopActions}><span/>
      <div className={styles.workspaceActions}>{canEdit ? <Link className={styles.secondaryButton} href={`/admin/clients/crm/${contact.id}/modifier`}><Pencil size={17}/>Modifier</Link> : null}{canDelete ? <DeleteCrmContactButton contactId={contact.id} contactName={`${contact.first_name} ${contact.last_name}`}/> : null}</div>
    </div>
    <section className={styles.detailHero}><Link className={styles.backLink} href="/admin/clients"><ArrowLeft size={18}/>Retour aux contacts</Link><div className={styles.detailHeroGrid}><div><p className={styles.eyebrow}>Fiche CRM interne</p><h1>{contact.first_name} {contact.last_name}</h1><p>Agent responsable : {agent?.full_name ?? "Non attribué"}</p></div><div className={styles.contactBox}>{contact.email ? <a href={`mailto:${contact.email}`}><Mail size={18}/>{contact.email}</a> : <span><Mail size={18}/>E-mail non renseigné</span>}{contact.phone ? <a href={`tel:${contact.phone.replace(/\s/g, "")}`}><Phone size={18}/>{contact.phone}</a> : <span><Phone size={18}/>Téléphone non renseigné</span>}</div></div></section>
    {feedback.created ? <p className={styles.successText}>La fiche CRM a été créée sans notification au contact.</p> : null}
    <section className={styles.detailGrid}>
      <InfoPanel title="Statut de la fiche"><Metric icon={ShieldCheck} label="Usage" value="CRM interne uniquement"/><Metric icon={UserRound} label="Agent commercial" value={agent?.full_name ?? "Non attribué"}/><Metric icon={Mail} label="E-mail" value={contact.email || "Facultatif — non renseigné"}/><Metric icon={Phone} label="Téléphone" value={contact.phone || "Facultatif — non renseigné"}/></InfoPanel>
      <InfoPanel title="Espace client lié"><Metric icon={Link2} label="Rattachement" value={clientAccount ? "Compte client rattaché" : "Aucun compte client"}/><Metric icon={Mail} label="Compte" value={clientAccount?.email ?? "Le contact reste uniquement dans le CRM"}/><Metric icon={Search} label="Recherches du client" value={String(clientSearches.length)}/><Metric icon={Calculator} label="Estimations du client" value={String(clientEstimations.length)}/></InfoPanel>
      {contact.notes ? <InfoPanel title="Notes internes" wide><p className={styles.mutedText}>{contact.notes}</p></InfoPanel> : null}
      <InfoPanel title="Créer pour ce contact" wide><InternalNotice/>{feedback.searchCreated ? <p className={styles.successText}>Recherche interne enregistrée.</p> : null}{feedback.estimationCreated ? <p className={styles.successText}>Estimation interne enregistrée.</p> : null}<div className={styles.crmActionGrid}><Link className={styles.crmActionCard} href={`/admin/clients/crm/${contact.id}/recherche/nouvelle`}><span><Search size={22}/></span><div><strong>Nouvelle recherche complète</strong><p>Localisation, budget, critères, préférences, projet et priorités.</p></div><ArrowRight size={20}/></Link><Link className={styles.crmActionCard} href={`/admin/clients/crm/${contact.id}/estimation/nouvelle`}><span><Calculator size={22}/></span><div><strong>Nouvelle estimation complète</strong><p>Adresse assistée, caractéristiques détaillées et résultat immédiat.</p><small className={styles.paidApiHint}><AlertTriangle size={14}/>Chaque estimation déclenche un appel API payant.</small></div><ArrowRight size={20}/></Link></div></InfoPanel>
      <ActivityPanel title={`Activité interne (${internalSearches.length + internalEstimations.length})`} empty="Aucun élément créé par l’équipe." hasItems={internalSearches.length + internalEstimations.length > 0}>{internalSearches.map((item) => <Activity key={item.id} href={`/admin/recherches/${item.id}`} label="Recherche interne" title={item.location_summary || "Secteur non renseigné"}/>)}{internalEstimations.map((item) => <Activity key={item.id} href={`/admin/estimations/${item.id}`} label="Estimation interne" title={item.address_label}/>)}</ActivityPanel>
      <ActivityPanel title={`Activité de l’espace client (${clientSearches.length + clientEstimations.length})`} empty={clientAccount ? "Aucune activité créée par le client." : "Aucun espace client rattaché."} hasItems={clientSearches.length + clientEstimations.length > 0}>{clientSearches.map((item) => <Activity key={item.id} href={`/admin/recherches/${item.id}`} label="Recherche du client" title={item.location_summary || "Secteur non renseigné"}/>)}{clientEstimations.map((item) => <Activity key={item.id} href={`/admin/estimations/${item.id}`} label="Estimation du client" title={item.address_label}/>)}</ActivityPanel>
    </section>
  </div></main>;
}

function InternalNotice() { return <div className={styles.noticeBox}><ShieldCheck size={18}/><p>Éléments strictement internes : aucune notification, aucun e-mail et aucune visibilité dans l’espace client.</p></div>; }
function InfoPanel({ children, title, wide }: { children: React.ReactNode; title: string; wide?: boolean }) { return <article className={styles.infoPanel} data-wide={wide || undefined}><h2>{title}</h2>{children}</article>; }
function Metric({ icon: Icon, label, value }: { icon: typeof UserRound; label: string; value: string }) { return <div className={styles.metricRow}><span><Icon size={18}/></span><div><small>{label}</small><strong>{value}</strong></div></div>; }
function ActivityPanel({ children, empty, hasItems, title }: { children: React.ReactNode; empty: string; hasItems: boolean; title: string }) { return <InfoPanel title={title} wide><div className={styles.activityList}>{hasItems ? children : <p className={styles.mutedText}>{empty}</p>}</div></InfoPanel>; }
function Activity({ href, label, title }: { href: string; label: string; title: string }) { return <Link className={styles.activityItem} href={href}><span><Building2 size={18}/></span><div><small>{label}</small><strong>{title}</strong></div><ArrowRight size={18}/></Link>; }
