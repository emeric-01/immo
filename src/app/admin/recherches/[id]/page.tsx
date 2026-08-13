import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BedDouble, CalendarDays, Euro, Gauge, Home, Mail, MapPin, Phone, ShieldCheck, Star, Trash2, UserRound } from "lucide-react";
import { MarketScoreCard } from "@/components/buyer-search/MarketScoreCard";
import {
  formatAdminPreferences,
  formatAdminPropertyTypes,
  formatPreferredChannels,
  getAdminBuyerSearch,
} from "@/lib/admin/buyer-searches";
import { optionLabel, financingOptions, purchaseTimelineOptions, situationOptions } from "@/lib/buyer-search/options";
import { requireAdminSession } from "@/lib/admin/auth";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { formatAdminAttribution, formatAdminAttributionCampaign, formatRecordOrigin } from "@/lib/admin/attribution-display";
import { listAdminUsers } from "@/lib/admin/users";
import { getInternalPropertyMatches } from "@/lib/admin/internal-property-matches";
import type { InternalPropertyMatchGroup } from "@/lib/admin/internal-property-matches";
import type { InternalPropertyMatch } from "@/lib/admin/search-property-matching";
import styles from "../../admin.module.css";
import { updateBuyerSearchAssignmentAction } from "../actions";
import { ArchiveBuyerSearchButton } from "./ArchiveBuyerSearchButton";
import { DeleteBuyerSearchButton } from "./DeleteBuyerSearchButton";

export const metadata: Metadata = {
  title: "Detail recherche | Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminBuyerSearchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAdminSession();
  await requireAdminPermission(session, "buyer_searches:read");
  const { id } = await params;
  const result = await getAdminBuyerSearch(id, session);

  if (result.status !== "ready") {
    return (
      <DetailFrame>
        <section className={styles.emptyState}>
          <ShieldCheck size={26} aria-hidden="true" />
          <h1>Lecture BDD a finaliser</h1>
          <p>{result.message}</p>
        </section>
      </DetailFrame>
    );
  }

  if (!result.data) {
    return (
      <DetailFrame>
        <section className={styles.emptyState}>
          <h1>Recherche introuvable</h1>
          <p>Ce formulaire n&apos;existe pas ou n&apos;est plus disponible.</p>
        </section>
      </DetailFrame>
    );
  }

  const { consents, locations, priorities, search } = result.data;
  const preferences = formatAdminPreferences(search);
  const [usersResult, internalMatches] = await Promise.all([
    listAdminUsers(),
    getInternalPropertyMatches(search, locations).catch(() => ({ agency: [], groups: [], interkab: [] })),
  ]);
  const users = usersResult.status === "ready" ? usersResult.data : [];
  const usersById = new Map(users.map((user) => [user.id, user]));
  const agents = users.filter((user) => user.is_active && user.role === "agent");
  const assignedAgent = search.assigned_admin_user_id ? usersById.get(search.assigned_admin_user_id) : null;
  const attributedAgent = search.attributed_admin_user_id ? usersById.get(search.attributed_admin_user_id) : null;
  const creatorAgent = search.created_by_admin_user_id ? usersById.get(search.created_by_admin_user_id) : null;
  const commercialAgent = assignedAgent ?? attributedAgent ?? creatorAgent;
  const contactName = `${search.contact_first_name} ${search.contact_last_name}`.trim();

  return (
    <DetailFrame>
      <section className={styles.detailHero}>
        <div className={styles.detailTopActions}>
          <Link className={styles.backLink} href="/admin/recherches">
            <ArrowLeft size={18} aria-hidden="true" />
            Retour aux recherches
          </Link>
          {session.role !== "agent" ? <div className={styles.workspaceActions}>
            {search.status !== "deleted_by_client" ? <ArchiveBuyerSearchButton hasClient={Boolean(search.client_account_id)} isArchived={search.status === "archived"} searchId={search.id} /> : null}
            <DeleteBuyerSearchButton contactName={contactName || "ce contact"} searchId={search.id} />
          </div> : null}
        </div>
        <div className={styles.detailHeroGrid}>
          <div>
            <p className={styles.eyebrow}>Formulaire acheteur</p>
            <h1>
              {search.contact_first_name} {search.contact_last_name}
            </h1>
            <p>{search.location_summary || "Localisation non renseignee"}</p>
          </div>
          <div className={styles.contactBox}>
            <a href={`mailto:${search.contact_email}`}>
              <Mail size={18} aria-hidden="true" />
              {search.contact_email}
            </a>
            <a href={`tel:${search.contact_phone.replace(/\s/g, "")}`}>
              <Phone size={18} aria-hidden="true" />
              {search.contact_phone}
            </a>
          </div>
        </div>
      </section>

      {search.status === "deleted_by_client" ? (
        <section className={styles.deletedNotice}>
          <Trash2 size={20} aria-hidden="true" />
          <div>
            <strong>Recherche supprimee par l&apos;utilisateur</strong>
            <p>Elle reste conservee dans l&apos;historique administratif{search.deleted_at ? ` depuis le ${formatDate(search.deleted_at)}` : ""}.</p>
          </div>
        </section>
      ) : null}

      <section className={styles.detailGrid}>
        {search.market_score !== null ? (
          <InternalPotentialScore
            computedAt={search.market_scored_at}
            label={search.market_score_label}
            score={search.market_score}
          />
        ) : null}

        {search.market_score_payload ? <MarketScoreCard score={search.market_score_payload} /> : null}

        <InfoPanel title="Synthese">
          <Metric icon={Home} label="Type de bien" value={formatAdminPropertyTypes(search.property_types)} />
          <Metric icon={Euro} label="Budget maximum" value={formatCurrency(search.maximum_budget)} />
          <Metric icon={BedDouble} label="Surface et pieces" value={formatSpace(search)} />
          <Metric icon={CalendarDays} label="Projet" value={formatProject(search)} />
        </InfoPanel>

        <InfoPanel title="Attribution commerciale">
          {session.role !== "agent" ? <form action={updateBuyerSearchAssignmentAction} className={styles.statusForm}>
            <input name="id" type="hidden" value={search.id} />
            <label htmlFor="assignedAdminUserId">Modifier le commercial responsable</label>
            <div><select defaultValue={search.assigned_admin_user_id ?? ""} id="assignedAdminUserId" name="assignedAdminUserId"><option value="">Non attribué</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.full_name}</option>)}</select><button type="submit">Enregistrer</button></div>
            <p className={styles.helpText}>L’origine Internet et la campagne restent conservées.</p>
          </form> : null}
          <Metric icon={UserRound} label="Agent commercial" value={commercialAgent?.full_name ?? "Aucun agent attribué"} />
          <Metric icon={Mail} label="E-mail de l’agent" value={commercialAgent?.email ?? "Non renseigné"} />
          <Metric icon={ShieldCheck} label="Mode de création" value={formatRecordOrigin(search.record_origin)} />
          <Metric icon={ShieldCheck} label="Origine" value={formatAdminAttribution(search.attribution_snapshot)} />
          <Metric icon={Gauge} label="Campagne" value={formatAdminAttributionCampaign(search.attribution_snapshot)} />
        </InfoPanel>

        <InfoPanel title="Localisation">
          {locations.length > 0 ? (
            <div className={styles.locationList}>
              {locations.map((location) => (
                <div key={location.id}>
                  <MapPin size={18} aria-hidden="true" />
                  <div>
                    <strong>{location.name}</strong>
                    <span>
                      {location.postal_code || location.postal_codes.join(", ") || "CP non renseigne"} - {location.radius_km ?? 0} km
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.mutedText}>Aucune ville detaillee.</p>
          )}
        </InfoPanel>

        <InfoPanel title="Preferences">
          {preferences.length > 0 ? (
            <div className={styles.tagGrid}>
              {preferences.map((preference) => (
                <span key={preference}>{preference}</span>
              ))}
            </div>
          ) : (
            <p className={styles.mutedText}>Aucune preference selectionnee.</p>
          )}
        </InfoPanel>

        <InfoPanel title="Priorites">
          {priorities.length > 0 ? (
            <div className={styles.priorityList}>
              {priorities.map((priority) => (
                <div key={priority.id}>
                  <Star size={18} aria-hidden="true" />
                  <div>
                    <strong>{priority.label}</strong>
                    <span>
                      {priority.value} - {priority.level === "essential" ? "Indispensable" : "Souhaite"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.mutedText}>Priorites non definies.</p>
          )}
        </InfoPanel>

        <InfoPanel title="Contact et consentement" wide>
          <div className={styles.contactSummary}>
            <Metric
              icon={UserRound}
              label="Moyens de contact"
              value={formatPreferredChannels(search.preferred_channels, search.preferred_channel)}
            />
            <Metric icon={ShieldCheck} label="Consentement" value={search.consent ? "Accepte" : "Non accepte"} />
            <Metric icon={CalendarDays} label="Date de depot" value={formatDate(search.created_at)} />
          </div>
          {consents[0] ? <p className={styles.consentText}>{consents[0].consent_text}</p> : null}
        </InfoPanel>
      </section>

      <InternalMatchesPanel groups={internalMatches.groups} />
    </DetailFrame>
  );
}

function InternalMatchesPanel({ groups }: { groups: InternalPropertyMatchGroup[] }) {
  const total = groups.reduce((sum, group) => sum + group.agency.length + group.interkab.length, 0);
  return <section className={styles.internalMatchesSection} aria-labelledby="internal-matches-title">
    <header className={styles.internalMatchesHeading}><div><p className={styles.eyebrow}>Sélection interne · après analyse du dossier</p><h2 id="internal-matches-title">Biens pouvant correspondre à cette recherche</h2><p>Classement par ville sélectionnée, rayon inclus. Résultats réservés aux administrateurs et agents : rien n’est affiché ni envoyé au client.</p></div><div className={styles.internalMatchesTotal}><strong>{total}</strong><span>bien{total > 1 ? "s" : ""} à examiner</span></div></header>
    <div className={styles.internalMatchLegend}><span data-tier="strict">Correspondance stricte</span><span data-tier="negotiation">Négociation ≤ 5 %</span><span data-tier="expanded">Opportunité ≤ 8 %</span></div>
    <div className={styles.internalMatchAreas}>{groups.map((group) => <MatchArea group={group} key={group.area.id} />)}</div>
  </section>;
}

function MatchArea({ group }: { group: InternalPropertyMatchGroup }) {
  const total = group.agency.length + group.interkab.length;
  return <section className={styles.internalMatchArea}>
    <header><div><MapPin size={19} aria-hidden="true" /><div><h3>{group.area.name}</h3><p>Ville et communes situées dans un rayon de {formatRadius(group.area.radiusKm)}</p></div></div><span>{total} bien{total > 1 ? "s" : ""}</span></header>
    <div className={styles.internalMatchColumns}>
      <MatchColumn matches={group.agency} title="Biens de l’agence" />
      <MatchColumn matches={group.interkab} title="Réseau Interkab" />
    </div>
  </section>;
}

function MatchColumn({ matches, title }: { matches: InternalPropertyMatch[]; title: string }) {
  return <section className={styles.internalMatchColumn}><header><h3>{title}</h3><span>{matches.length}</span></header>{matches.length ? <div className={styles.internalMatchList}>{matches.map((match) => <article className={styles.internalMatchCard} key={`${match.source}-${match.id}`}>
    <div className={styles.internalMatchMedia}>{match.imageUrl ? <Image alt={match.title} fill sizes="(max-width: 600px) 100vw, 180px" src={match.imageUrl}/> : <Home aria-hidden="true" size={30}/>}</div>
    <div className={styles.internalMatchContent}>
      <div className={styles.internalMatchTop}><div className={styles.internalMatchIdentity}><strong>{match.title}</strong><span>{formatCurrency(match.price)} · {match.surfaceM2 ? `${match.surfaceM2.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} m²` : "Surface NC"}</span></div><span className={styles.internalMatchScore} data-tier={match.tier}><strong>{match.score}/100</strong><small>{matchTierLabel(match.tier)}</small></span></div>
      <div className={styles.internalMatchMarket}><div><small>Prix affiché au m²</small><strong>{formatPricePerM2(match.pricePerM2)}</strong></div><div><small>Position face au marché</small><strong data-tone={marketGapTone(match.marketGapPercent)}>{formatMarketGap(match.marketGapPercent)}</strong>{match.marketPricePerM2 ? <span>Moyenne locale : {formatPricePerM2(match.marketPricePerM2)}</span> : null}</div></div>
      <p>{match.reasons.slice(0, 4).join(" · ")}</p>
      <footer>{match.checks.length ? <small>À vérifier : {match.checks.join(", ")}</small> : <small>Critères principaux renseignés</small>}<Link href={match.url} rel={match.source === "interkab" ? "noreferrer" : undefined} target={match.source === "interkab" ? "_blank" : undefined}>Voir le bien →</Link></footer>
    </div>
  </article>)}</div> : <p className={styles.internalMatchEmpty}>Aucun rapprochement suffisant pour le moment.</p>}</section>;
}

function matchTierLabel(tier: InternalPropertyMatch["tier"]) {
  return tier === "strict" ? "Correspondance stricte" : tier === "negotiation" ? "Négociation ≤ 5 %" : "Opportunité ≤ 8 %";
}

function formatPricePerM2(value?: number | null) {
  return value ? `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value)} €/m²` : "Non disponible";
}

function formatMarketGap(value?: number | null) {
  if (value === null || value === undefined) return "Référence indisponible";
  const gap = Math.abs(value).toLocaleString("fr-FR", { maximumFractionDigits: 1 });
  if (value < 0) return `${gap} % sous le prix moyen`;
  if (value > 0) return `${gap} % au-dessus du prix moyen`;
  return "Aligné avec le prix moyen";
}

function marketGapTone(value?: number | null) {
  if (value === null || value === undefined) return "neutral";
  return value <= 0 ? "positive" : value <= 8 ? "coherent" : "warning";
}

function formatRadius(radiusKm: number) {
  return `${Number.isInteger(radiusKm) ? radiusKm : radiusKm.toLocaleString("fr-FR")} km`;
}

function InternalPotentialScore({
  computedAt,
  label,
  score,
}: {
  computedAt: string | null;
  label: string | null;
  score: number;
}) {
  const boundedScore = Math.min(100, Math.max(0, score));
  const reading = getInternalScoreReading(boundedScore);

  return (
    <article className={styles.internalScorePanel} data-tone={reading.tone}>
      <div className={styles.internalScoreHeading}>
        <div className={styles.internalScoreIcon}>
          <Gauge size={22} aria-hidden="true" />
        </div>
        <div>
          <p className={styles.eyebrow}>Indicateur interne</p>
          <h2>Score de potentiel de la recherche</h2>
        </div>
      </div>

      <div className={styles.internalScoreValue}>
        <strong>{boundedScore}</strong>
        <span>/100</span>
        <em>{reading.label}</em>
      </div>

      <div className={styles.internalScoreGauge} aria-hidden="true">
        <span style={{ width: `${boundedScore}%` }} />
      </div>

      <div className={styles.internalScoreCopy}>
        <p>
          Indicateur calculé à partir du budget, des prix observés, de la zone recherchée et du nombre de ventes comparables.
          Il aide à prioriser le suivi commercial, sans remplacer la qualification par un membre de l&apos;équipe.
        </p>
        <small>
          {label ? `${label} · ` : ""}
          {computedAt ? `Calculé le ${formatDate(computedAt)}` : "Calcul automatique"}
        </small>
      </div>
    </article>
  );
}

function getInternalScoreReading(score: number) {
  if (score >= 80) {
    return { label: "Potentiel élevé", tone: "positive" };
  }

  if (score >= 60) {
    return { label: "À qualifier en priorité", tone: "coherent" };
  }

  if (score >= 40) {
    return { label: "Recherche exigeante", tone: "warning" };
  }

  return { label: "Critères à ajuster", tone: "difficult" };
}

function DetailFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className={styles.detailPage}>
      <div className={styles.detailShell}>{children}</div>
    </main>
  );
}

function InfoPanel({ children, title, wide }: { children: React.ReactNode; title: string; wide?: boolean }) {
  return (
    <article className={styles.infoPanel} data-wide={wide || undefined}>
      <h2>{title}</h2>
      {children}
    </article>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Home; label: string; value: string }) {
  return (
    <div className={styles.metricRow}>
      <span>
        <Icon size={18} aria-hidden="true" />
      </span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function formatCurrency(value?: number | null) {
  if (!value) {
    return "Non renseigne";
  }

  return new Intl.NumberFormat("fr-FR", {
    currency: "EUR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatSpace(search: {
  minimum_bathrooms: number | null;
  minimum_bedrooms: number | null;
  minimum_land_area: number | null;
  minimum_living_area: number | null;
  minimum_rooms: number | null;
}) {
  return [
    `${search.minimum_living_area ?? 0} m2 hab.`,
    search.minimum_land_area ? `${search.minimum_land_area} m2 terrain` : null,
    `${search.minimum_rooms ?? 0} pieces`,
    `${search.minimum_bedrooms ?? 0} chambres`,
    `${search.minimum_bathrooms ?? 0} sde`,
  ]
    .filter(Boolean)
    .join(" - ");
}

function formatProject(search: { current_situation: string | null; financing_status: string | null; purchase_timeline: string | null }) {
  return [
    optionLabel(purchaseTimelineOptions, search.purchase_timeline),
    optionLabel(financingOptions, search.financing_status),
    optionLabel(situationOptions, search.current_situation),
  ]
    .filter(Boolean)
    .join(" - ");
}
