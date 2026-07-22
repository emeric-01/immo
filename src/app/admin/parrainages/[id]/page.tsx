import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Building2, CalendarDays, Gift, HeartHandshake, Mail, MapPin, MessageSquareText, Phone, ShieldCheck, UserRound } from "lucide-react";
import { requireAdminSession } from "@/lib/admin/auth";
import { getAdminReferral } from "@/lib/admin/referrals";
import { formatReferralProjectKind, formatReferralPropertyType, formatReferralStatus, referralStatuses } from "@/lib/referrals";
import styles from "../../admin.module.css";
import { updateReferralStatusAction } from "../actions";

export const metadata: Metadata = { title: "Détail parrainage | Admin" };
export const dynamic = "force-dynamic";

export default async function AdminReferralDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession();
  const { id } = await params;
  const result = await getAdminReferral(id);

  if (result.status !== "ready") return <DetailFrame><EmptyState title="Lecture BDD a finaliser" text={result.message} /></DetailFrame>;
  if (!result.data) return <DetailFrame><EmptyState title="Parrainage introuvable" text="Ce parrainage n’existe pas ou n’est plus disponible." /></DetailFrame>;

  const referral = result.data;
  return <DetailFrame>
    <section className={styles.detailHero}>
      <Link className={styles.backLink} href="/admin/parrainages"><ArrowLeft aria-hidden="true" size={18} />Retour aux parrainages</Link>
      <div className={styles.detailHeroGrid}>
        <div><p className={styles.eyebrow}>Parrainage du {formatDate(referral.created_at)}</p><h1>{referral.referred_first_name} {referral.referred_last_name}</h1><p>{formatReferralProjectKind(referral.project_kind)} · {formatReferralPropertyType(referral.property_type)} à {referral.property_city}</p></div>
        <div className={styles.contactBox}><a href={`mailto:${referral.sponsor_email}`}><Mail aria-hidden="true" size={18} />{referral.sponsor_email}</a><a href={`tel:${referral.sponsor_phone.replace(/\s/g, "")}`}><Phone aria-hidden="true" size={18} />{referral.sponsor_phone}</a>{referral.sponsor_client_account_id ? <Link href={`/admin/clients/${referral.sponsor_client_account_id}`}><UserRound aria-hidden="true" size={18} />Voir le compte client</Link> : null}</div>
      </div>
    </section>

    <section className={styles.detailGrid}>
      <InfoPanel title="Suivi du dossier">
        <form action={updateReferralStatusAction} className={styles.statusForm}>
          <input name="id" type="hidden" value={referral.id} />
          <label htmlFor="referral-status">Statut du parrainage</label>
          <div><select defaultValue={referral.status} id="referral-status" name="status">{referralStatuses.map((status) => <option key={status} value={status}>{formatReferralStatus(status)}</option>)}</select><button type="submit">Mettre à jour</button></div>
        </form>
        <Metric icon={ShieldCheck} label="Statut actuel" value={formatReferralStatus(referral.status)} />
        <Metric icon={Gift} label="Prime" value={referral.reward_paid_at ? `Versée le ${formatDate(referral.reward_paid_at)}` : "Non versée"} />
        <Metric icon={CalendarDays} label="Dernière mise à jour" value={formatDate(referral.updated_at)} />
      </InfoPanel>

      <InfoPanel title="Le parrain">
        <Metric icon={UserRound} label="Nom" value={`${referral.sponsor_first_name} ${referral.sponsor_last_name}`} />
        <Metric icon={Mail} label="Email" value={referral.sponsor_email} />
        <Metric icon={Phone} label="Téléphone" value={referral.sponsor_phone} />
        <Metric icon={HeartHandshake} label="Compte client" value={referral.sponsor_client_account_id ? "Compte rattaché" : "Aucun compte créé"} />
      </InfoPanel>

      <InfoPanel title="Le proche présenté">
        <Metric icon={UserRound} label="Nom" value={`${referral.referred_first_name} ${referral.referred_last_name}`} />
        <Metric icon={Mail} label="Email" value={referral.referred_email || "Non renseigné"} />
        <Metric icon={Phone} label="Téléphone" value={referral.referred_phone} />
        <Metric icon={ShieldCheck} label="Consentement" value={`Enregistré le ${formatDate(referral.consent_recorded_at)}`} />
      </InfoPanel>

      <InfoPanel title="Projet immobilier">
        <Metric icon={HeartHandshake} label="Nature" value={formatReferralProjectKind(referral.project_kind)} />
        <Metric icon={Building2} label="Type de bien" value={formatReferralPropertyType(referral.property_type)} />
        <Metric icon={MapPin} label="Ville ou secteur" value={referral.property_city} />
        <Metric icon={MessageSquareText} label="Message" value={referral.message || "Aucun message complémentaire"} />
      </InfoPanel>
    </section>
  </DetailFrame>;
}

function DetailFrame({ children }: { children: React.ReactNode }) { return <main className={styles.detailPage}><div className={styles.detailShell}>{children}</div></main>; }
function EmptyState({ title, text }: { title: string; text: string }) { return <section className={styles.emptyState}><ShieldCheck aria-hidden="true" size={26} /><h1>{title}</h1><p>{text}</p></section>; }
function InfoPanel({ children, title }: { children: React.ReactNode; title: string }) { return <article className={styles.infoPanel}><h2>{title}</h2>{children}</article>; }
function Metric({ icon: Icon, label, value }: { icon: typeof UserRound; label: string; value: string }) { return <div className={styles.metricRow}><span><Icon aria-hidden="true" size={18} /></span><div><small>{label}</small><strong>{value}</strong></div></div>; }
function formatDate(value: string) { return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
