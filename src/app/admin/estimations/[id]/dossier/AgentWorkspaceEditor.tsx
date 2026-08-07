"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, BarChart3, Building2, Camera, CheckCircle2, Download, Eye, EyeOff, Home, LoaderCircle, MapPin, Save, Trash2, Upload } from "lucide-react";
import type { EstimationAgentWorkspace, EstimationWorkspacePhoto, WorkspaceUpdate } from "@/lib/admin/estimation-workspaces";
import type { EstimationReportSnapshot } from "@/lib/admin/estimation-reports";
import type { EstimationReportBlock, EstimationReportBlockId } from "@/lib/estimation-report-config";
import { reportBlockDefinitions } from "@/lib/estimation-report-config";
import type { InseeDistributionItem, InseeHousingProfile } from "@/lib/insee-housing";
import type { CityPriceHistoryPoint } from "@/lib/city-market-data";
import { historyDurationLabel } from "@/lib/price-history";
import { ReportLocationMap } from "./ReportLocationMap";
import styles from "../../../admin.module.css";

type Original = { high: number; low: number; median: number; pricePerM2: number };
type Props = { estimationId: string; initial: EstimationAgentWorkspace; inseeProfile: InseeHousingProfile | null; mapboxToken: string; marketHistory: CityPriceHistoryPoint[]; original: Original; snapshots: EstimationReportSnapshot[] };
const reportBlockLabels = new Map(reportBlockDefinitions.map((block) => [block.id, block.label]));

export function AgentWorkspaceEditor({ estimationId, initial, inseeProfile, mapboxToken, marketHistory, original, snapshots }: Props) {
  const router = useRouter();
  const [workspace, setWorkspace] = useState(() => hydrateWorkspace(initial));
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error" | "pdf" | "uploading">("idle");
  const [message, setMessage] = useState("");
  const input = workspace.draft_input_payload;
  const result = workspace.draft_result_payload;
  const coordinates = result.coordinates ?? (input.selectedAddress ? { latitude: input.selectedAddress.latitude, longitude: input.selectedAddress.longitude } : undefined);
  const history = marketHistory.length ? marketHistory : toCityHistory(result.market?.priceHistory ?? [], input.propertyType);
  const enabledBlocks = workspace.report_blocks.filter((block) => block.enabled);

  function patch<K extends keyof EstimationAgentWorkspace>(key: K, value: EstimationAgentWorkspace[K]) { setWorkspace((current) => ({ ...current, [key]: value })); setState("idle"); }
  function move(index: number, direction: -1 | 1) { const target = index + direction; if (target < 0 || target >= workspace.report_blocks.length) return; const blocks = [...workspace.report_blocks]; [blocks[index], blocks[target]] = [blocks[target], blocks[index]]; patch("report_blocks", blocks); }
  function toggle(index: number) { patch("report_blocks", workspace.report_blocks.map((block, position) => position === index ? { ...block, enabled: !block.enabled } : block)); }
  function blockIndex(id: EstimationReportBlockId) { return workspace.report_blocks.findIndex((block) => block.id === id); }

  async function persist() {
    setState("saving"); setMessage("");
    const payload: WorkspaceUpdate = { agent_analysis: workspace.agent_analysis, high_price: Number(workspace.high_price), low_price: Number(workspace.low_price), median_price: Number(workspace.median_price), photos: workspace.photos, report_blocks: workspace.report_blocks, reservations: workspace.reservations, sale_strategy: workspace.sale_strategy, status: workspace.status, strengths: workspace.strengths, title: workspace.title };
    const response = await fetch(`/api/admin/estimation-workspaces/${workspace.id}`, { method: "PATCH", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    const data = await response.json().catch(() => null) as { error?: string; workspace?: EstimationAgentWorkspace } | null;
    if (!response.ok || !data?.workspace) throw new Error(data?.error || "Enregistrement impossible.");
    setWorkspace(data.workspace); setState("saved"); setMessage("Rapport enregistré."); router.refresh();
    return data.workspace;
  }

  async function save() { try { await persist(); } catch (cause) { setState("error"); setMessage(cause instanceof Error ? cause.message : "Enregistrement impossible."); } }
  async function generatePdf() {
    try {
      await persist(); setState("pdf"); setMessage("Création et archivage de la version PDF…");
      const response = await fetch(`/admin/api/estimation-workspaces/${workspace.id}/pdf`, { method: "POST" });
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || "Génération impossible.");
      const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement("a");
      link.href = url; link.download = response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? `estimation-${workspace.id}.pdf`; link.style.display = "none"; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 30_000);
      setState("saved"); setMessage(`Version ${response.headers.get("X-Report-Version") ?? "nouvelle"} figée, archivée et téléchargée.`); router.refresh();
    } catch (cause) { setState("error"); setMessage(cause instanceof Error ? cause.message : "Génération impossible."); }
  }

  async function uploadPhotos(files: FileList | null) {
    if (!files?.length) return;
    setState("uploading"); setMessage("");
    try {
      let latest = workspace;
      for (const file of Array.from(files).slice(0, Math.max(0, 10 - workspace.photos.length))) {
        const form = new FormData(); form.set("photo", file);
        const response = await fetch(`/api/admin/estimation-workspaces/${workspace.id}/photos`, { method: "POST", body: form });
        const data = await response.json().catch(() => null) as { error?: string; workspace?: EstimationAgentWorkspace } | null;
        if (!response.ok || !data?.workspace) throw new Error(data?.error || "Envoi impossible.");
        latest = data.workspace; setWorkspace(latest);
      }
      setState("saved"); setMessage("Photos ajoutées au rapport privé.");
    } catch (cause) { setState("error"); setMessage(cause instanceof Error ? cause.message : "Envoi impossible."); }
  }

  async function removePhoto(photoId: string) {
    setState("uploading");
    try {
      const response = await fetch(`/api/admin/estimation-workspaces/${workspace.id}/photos`, { method: "DELETE", body: JSON.stringify({ photoId }), headers: { "Content-Type": "application/json" } });
      const data = await response.json().catch(() => null) as { error?: string; workspace?: EstimationAgentWorkspace } | null;
      if (!response.ok || !data?.workspace) throw new Error(data?.error || "Suppression impossible.");
      setWorkspace(data.workspace); setState("saved"); setMessage("Photo supprimée.");
    } catch (cause) { setState("error"); setMessage(cause instanceof Error ? cause.message : "Suppression impossible."); }
  }

  return <main className={styles.detailPage}><div className={styles.detailShell}>
    <section className={styles.workspaceHero}><div><Link className={styles.backLink} href={`/admin/estimations/${estimationId}`}><ArrowLeft size={18} />Voir l’estimation originale</Link><p className={styles.eyebrow}>Rapport professionnel de l’agent</p><input aria-label="Titre du rapport" className={styles.workspaceTitleInput} value={workspace.title} onChange={(event) => patch("title", event.target.value)} /></div><div className={styles.workspaceActions}><label className={styles.workspaceStatus}>État<select value={workspace.status} onChange={(event) => patch("status", event.target.value as EstimationAgentWorkspace["status"])}><option value="draft">Brouillon</option><option value="ready">Prêt à présenter</option><option value="archived">Archivé</option></select></label><button className={styles.secondaryButton} disabled={state === "saving" || state === "pdf" || state === "uploading"} onClick={save} type="button">{state === "saving" ? <LoaderCircle className={styles.spin} size={18} /> : <Save size={18} />}Enregistrer</button><button className={styles.primaryButton} disabled={state === "saving" || state === "pdf" || state === "uploading"} onClick={generatePdf} type="button">{state === "pdf" ? <LoaderCircle className={styles.spin} size={18} /> : <Download size={18} />}Créer une version PDF</button></div></section>

    {message ? <p aria-live="polite" className={state === "error" ? styles.errorText : styles.successText}>{message}</p> : null}
    <section className={styles.workspaceOrigin}><div><p className={styles.eyebrow}>Source verrouillée</p><h2>Estimation automatique initiale</h2><p>La saisie client et les valeurs d’origine restent intactes. Le rapport ci-dessous constitue une copie de travail.</p></div><div><Value label="Basse" value={original.low} /><Value label="Centrale" value={original.median} /><Value label="Haute" value={original.high} /><Value label="Prix au m²" value={original.pricePerM2} suffix=" €/m²" /></div></section>

    <div className={styles.liveReportLayout}>
      <section className={styles.liveReportCanvas} aria-label="Aperçu éditable du rapport">
        <header className={styles.liveReportCover}><div><span>Les Jumelles Immo</span><small>Dossier d’estimation professionnelle</small></div><p>{result.addressLabel}</p><h1>{propertyLabel(input.propertyType)} de {formatNumber(input.surfaceM2)} m²</h1><span>{input.rooms} pièces · {input.selectedAddress?.cityName ?? "Secteur renseigné"}</span></header>
        {enabledBlocks.map((block) => <LiveReportBlock block={block.id} coordinates={coordinates} history={history} inseeProfile={inseeProfile} input={input} key={block.id} mapboxToken={mapboxToken} move={move} patch={patch} removePhoto={removePhoto} result={result} uploadPhotos={uploadPhotos} workspace={workspace} index={blockIndex(block.id)} />)}
        <footer className={styles.liveReportFooter}>Document d’estimation non contractuel · Les Jumelles Immo</footer>
      </section>

      <aside className={styles.reportComposer}><header><p className={styles.eyebrow}>Composition du rapport</p><h2>Afficher et ordonner</h2><p>La grande colonne est l’aperçu du rapport. Modifiez les textes directement dedans, puis masquez ou déplacez les rubriques ici.</p></header><div className={styles.reportBlockList}>{workspace.report_blocks.map((block, index) => <ReportBlockRow block={block} index={index} key={block.id} label={reportBlockLabels.get(block.id) ?? block.id} length={workspace.report_blocks.length} move={move} toggle={toggle} />)}</div><div className={styles.reportPreviewNote}><CheckCircle2 size={18} /><span>La carte interactive charge uniquement le secteur affiché. L’image cartographique du PDF est appelée à la génération puis mise en cache 30 jours. Les données marché et INSEE proviennent du cache du dossier.</span></div></aside>
    </div>
    <section className={styles.reportHistory}><header><p className={styles.eyebrow}>Versions figées</p><h2>Rapports déjà remis</h2><p>Chaque version conserve son contenu, ses photos, son ordre et ses données au moment exact de la génération.</p></header>{snapshots.length ? <div className={styles.adminComparableList}>{snapshots.map((snapshot) => <article key={snapshot.id}><div><strong>Version {snapshot.version}</strong><span>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(snapshot.created_at))} · archive immuable</span></div><a className={styles.backLink} href={`/admin/api/estimations/${estimationId}/pdf/${snapshot.id}`}><Download size={16} />Télécharger</a></article>)}</div> : <p className={styles.helpText}>Aucune version générée pour le moment.</p>}</section>
  </div></main>;
}

type BlockProps = { block: EstimationReportBlockId; coordinates?: { latitude: number; longitude: number }; history: CityPriceHistoryPoint[]; index: number; inseeProfile: InseeHousingProfile | null; input: EstimationAgentWorkspace["draft_input_payload"]; mapboxToken: string; move: (index: number, direction: -1 | 1) => void; patch: <K extends keyof EstimationAgentWorkspace>(key: K, value: EstimationAgentWorkspace[K]) => void; removePhoto: (photoId: string) => void; result: EstimationAgentWorkspace["draft_result_payload"]; uploadPhotos: (files: FileList | null) => void; workspace: EstimationAgentWorkspace };

function LiveReportBlock(props: BlockProps) {
  const { block, index, input, workspace } = props;
  const title = reportBlockLabels.get(block) ?? block;
  return <article className={styles.liveReportSection} id={`report-${block}`}>
    <SectionToolbar index={index} label={title} move={props.move} />
    {block === "valuation" ? <><p className={styles.liveReportKicker}>Notre avis de valeur</p><h2>Un positionnement défendable sur le marché</h2><div className={styles.liveValuationGrid}><PriceInput label="Fourchette basse" value={workspace.low_price} onChange={(value) => props.patch("low_price", value)} /><PriceInput label="Valeur centrale" value={workspace.median_price} onChange={(value) => props.patch("median_price", value)} /><PriceInput label="Fourchette haute" value={workspace.high_price} onChange={(value) => props.patch("high_price", value)} /></div><p className={styles.liveCentralPrice}>{formatCurrency(workspace.median_price)} <span>soit {formatNumber(Math.round(workspace.median_price / input.surfaceM2))} €/m²</span></p></> : null}
    {block === "photos" ? <PhotoReportBlock onChange={(photos) => props.patch("photos", photos)} onRemove={props.removePhoto} onUpload={props.uploadPhotos} photos={workspace.photos} workspaceId={workspace.id} /> : null}
    {block === "property" ? <PropertySummary input={input} /> : null}
    {block === "location" ? <LocationReportBlock address={props.result.addressLabel} coordinates={props.coordinates} mapboxToken={props.mapboxToken} /> : null}
    {block === "agent_analysis" ? <EditableNarrative hint="Expliquez ici votre lecture du bien, de son emplacement et de son positionnement." label="Analyse professionnelle" value={workspace.agent_analysis} onChange={(value) => props.patch("agent_analysis", value)} /> : null}
    {block === "strengths" ? <div className={styles.liveTwoColumns}><EditableNarrative compact label="Points forts" value={workspace.strengths} onChange={(value) => props.patch("strengths", value)} /><EditableNarrative compact label="Points de vigilance" value={workspace.reservations} onChange={(value) => props.patch("reservations", value)} /></div> : null}
    {block === "price_history" ? <PriceHistoryChart history={props.history} propertyType={input.propertyType} /> : null}
    {block === "market" ? <MarketSummary result={props.result} /> : null}
    {block === "comparables" ? <Comparables result={props.result} /> : null}
    {block === "insee" ? <InseeDashboard profile={props.inseeProfile} /> : null}
    {block === "strategy" ? <EditableNarrative hint="Prix de lancement, mise en valeur, diffusion, visites et cible acquéreur." label="Stratégie de commercialisation" value={workspace.sale_strategy} onChange={(value) => props.patch("sale_strategy", value)} /> : null}
    {block === "methodology" ? <><p className={styles.liveReportKicker}>Méthode</p><h2>Des données vérifiables, complétées par le terrain</h2><p className={styles.liveBody}>Cette étude rapproche les informations déclarées, le calcul automatique conservé dans le dossier, les données de marché et l’analyse professionnelle de l’agent. La visite et l’étude des documents restent nécessaires avant toute mise en vente.</p></> : null}
    {block === "agency" ? <><p className={styles.liveReportKicker}>Les Jumelles Immo</p><h2>Estimer, révéler et vendre avec une même équipe</h2><p className={styles.liveBody}>Notre double compétence en transaction, urbanisme et architecture intérieure permet de défendre la valeur du bien et d’aider les acquéreurs à comprendre son potentiel.</p></> : null}
  </article>;
}

function SectionToolbar({ index, label, move }: { index: number; label: string; move: (index: number, direction: -1 | 1) => void }) { return <div className={styles.liveSectionToolbar}><span>{String(index + 1).padStart(2, "0")} · {label}</span><div><button aria-label={`Monter ${label}`} onClick={() => move(index, -1)} type="button"><ArrowUp size={15} /></button><button aria-label={`Descendre ${label}`} onClick={() => move(index, 1)} type="button"><ArrowDown size={15} /></button></div></div>; }
function Value({ label, suffix = " €", value }: { label: string; suffix?: string; value: number }) { return <span><small>{label}</small><strong>{formatNumber(value)}{suffix}</strong></span>; }
function PriceInput({ label, onChange, value }: { label: string; onChange: (value: number) => void; value: number }) { return <label className={styles.livePriceInput}><span>{label}</span><div><input min="0" onChange={(event) => onChange(Number(event.target.value))} step="100" type="number" value={value} /><strong>€</strong></div></label>; }
function EditableNarrative({ compact, hint, label, onChange, value }: { compact?: boolean; hint?: string; label: string; onChange: (value: string) => void; value: string }) { return <label className={styles.liveNarrative}><span>{label}</span>{hint ? <small>{hint}</small> : null}<textarea aria-label={label} rows={compact ? 5 : 7} value={value} onChange={(event) => onChange(event.target.value)} /></label>; }

function PhotoReportBlock({ onChange, onRemove, onUpload, photos, workspaceId }: { onChange: (photos: EstimationWorkspacePhoto[]) => void; onRemove: (id: string) => void; onUpload: (files: FileList | null) => void; photos: EstimationWorkspacePhoto[]; workspaceId: string }) {
  return <><div className={styles.liveReportHeading}><div><p className={styles.liveReportKicker}>Le bien en images</p><h2>Photographies intégrées au rapport</h2></div><label className={styles.photoUploadButton}><Upload size={17} />Ajouter des photos<input accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => { onUpload(event.target.files); event.target.value = ""; }} type="file" /></label></div>{photos.length ? <div className={styles.reportPhotoGrid}>{photos.map((photo) => <article data-disabled={!photo.enabled || undefined} key={photo.id}><div><Image alt={photo.caption || photo.name} fill sizes="(max-width: 800px) 100vw, 320px" src={`/admin/api/estimation-workspaces/${workspaceId}/photos/${photo.id}`} unoptimized /></div><input aria-label={`Légende de ${photo.name}`} onChange={(event) => onChange(photos.map((candidate) => candidate.id === photo.id ? { ...candidate, caption: event.target.value } : candidate))} placeholder="Légende facultative" value={photo.caption} /><footer><button onClick={() => onChange(photos.map((candidate) => candidate.id === photo.id ? { ...candidate, enabled: !candidate.enabled } : candidate))} type="button">{photo.enabled ? <Eye size={15} /> : <EyeOff size={15} />}{photo.enabled ? "Dans le PDF" : "Masquée"}</button><button aria-label={`Supprimer ${photo.name}`} onClick={() => onRemove(photo.id)} type="button"><Trash2 size={15} /></button></footer></article>)}</div> : <label className={styles.reportPhotoEmpty}><Camera size={30} /><strong>Ajoutez jusqu’à 10 photos du bien</strong><span>JPG, PNG ou WebP · 12 Mo maximum par image · stockage privé</span><input accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => { onUpload(event.target.files); event.target.value = ""; }} type="file" /></label>}</>;
}

function PropertySummary({ input }: { input: EstimationAgentWorkspace["draft_input_payload"] }) {
  const facts = [["Type", propertyLabel(input.propertyType)], ["Surface habitable", `${formatNumber(input.surfaceM2)} m²`], ["Pièces", String(input.rooms)], ["État", conditionLabel(input.condition)], ["Construction", input.constructionYear ? String(input.constructionYear) : "Non renseignée"], ["DPE", input.dpe ?? "Non renseigné"]];
  return <><p className={styles.liveReportKicker}>Caractéristiques déclarées</p><h2>Le bien étudié</h2><div className={styles.liveFactGrid}>{facts.map(([label, value]) => <span key={label}><small>{label}</small><strong>{value}</strong></span>)}</div></>;
}

function LocationReportBlock({ address, coordinates, mapboxToken }: { address: string; coordinates?: { latitude: number; longitude: number }; mapboxToken: string }) {
  return <><p className={styles.liveReportKicker}>Localisation</p><h2>{address}</h2>{coordinates ? <><ReportLocationMap accessToken={mapboxToken} address={address} latitude={coordinates.latitude} longitude={coordinates.longitude} /><a className={styles.reportMapLink} href={`https://www.google.com/maps/search/?api=1&query=${coordinates.latitude},${coordinates.longitude}`} rel="noreferrer" target="_blank"><MapPin size={16} />Ouvrir l’adresse dans Google Maps</a></> : <p className={styles.liveBody}>Coordonnées indisponibles pour cette estimation.</p>}</>;
}

function PriceHistoryChart({ history, propertyType }: { history: CityPriceHistoryPoint[]; propertyType: "apartment" | "house" }) {
  const points = useMemo(() => history.map((point) => ({ label: point.period, value: propertyType === "house" ? point.house : point.apartment })).filter((point) => Number.isFinite(point.value)), [history, propertyType]);
  const chart = chartGeometry(points);
  const firstPeriod = points[0]?.label ?? ""; const lastPeriod = points.at(-1)?.label ?? "";
  return <><div className={styles.liveReportHeading}><div><p className={styles.liveReportKicker}>Évolution locale</p><h2>Prix au m² depuis {firstPeriod ? shortPeriod(firstPeriod) : "la première donnée disponible"}</h2></div>{points.length > 1 ? <strong className={chart.delta >= 0 ? styles.trendPositive : styles.trendNegative}>{chart.delta >= 0 ? "+" : ""}{chart.delta.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} % depuis {shortPeriod(firstPeriod)}</strong> : null}</div>{points.length > 1 ? <div className={styles.livePriceChart}><div className={styles.chartTopValue}>{formatNumber(points.at(-1)?.value ?? 0)} €/m²</div><svg aria-label="Évolution du prix au mètre carré" role="img" viewBox="0 0 720 240"><defs><linearGradient id="price-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#bd7446" stopOpacity=".28"/><stop offset="1" stopColor="#bd7446" stopOpacity="0"/></linearGradient></defs><path className={styles.priceChartArea} d={`${chart.path} L 700 210 L 20 210 Z`} /><path className={styles.priceChartLine} d={chart.path} /><line x1="20" x2="700" y1="210" y2="210" /></svg><div className={styles.chartAxis}><span>{shortPeriod(firstPeriod)}</span><span>{historyDurationLabel(firstPeriod, lastPeriod)} · {propertyType === "house" ? "Maisons" : "Appartements"}</span><span>{shortPeriod(lastPeriod)}</span></div></div> : <p className={styles.liveBody}>L’historique pluriannuel n’est pas disponible dans ce dossier. Les 12 derniers mois restent présentés dans les repères marché.</p>}</>;
}

function MarketSummary({ result }: { result: EstimationAgentWorkspace["draft_result_payload"] }) { const market = result.market; return <><p className={styles.liveReportKicker}>Marché local</p><h2>Les repères qui situent le bien</h2><div className={styles.liveMetricGrid}><span><BarChart3/><small>Prix moyen du secteur</small><strong>{market?.sectorPricePerM2 ? `${formatNumber(market.sectorPricePerM2)} €/m²` : "NC"}</strong></span><span><Home/><small>Évolution sur 12 mois</small><strong>{percent(market?.priceEvolution12Months)}</strong></span><span><Building2/><small>Délai observé</small><strong>{market?.saleDurationDays ? `${market.saleDurationDays} jours` : "NC"}</strong></span><span><CheckCircle2/><small>Demande locale</small><strong>{market?.demandLevel ?? "NC"}</strong></span></div></>; }
function Comparables({ result }: { result: EstimationAgentWorkspace["draft_result_payload"] }) { return <><p className={styles.liveReportKicker}>Preuves de marché</p><h2>Transactions comparables</h2><div className={styles.liveComparableList}>{result.comparables.length ? result.comparables.slice(0, 8).map((sale) => <article key={sale.id}><div><strong>{sale.label}</strong><span>{sale.surfaceM2 ? `${formatNumber(sale.surfaceM2)} m²` : "Surface NC"} · {sale.distanceMeters !== undefined ? formatDistance(sale.distanceMeters) : "Distance NC"}</span></div><div><strong>{formatCurrency(sale.price)}</strong><span>{sale.pricePerM2 ? `${formatNumber(sale.pricePerM2)} €/m²` : "Prix/m² NC"}</span></div></article>) : <p>Aucune vente comparable exploitable.</p>}</div></>; }

function InseeDashboard({ profile }: { profile: InseeHousingProfile | null }) {
  if (!profile) return <><p className={styles.liveReportKicker}>Données publiques</p><h2>Portrait résidentiel INSEE</h2><p className={styles.liveBody}>Les données communales ne sont pas disponibles pour cette adresse.</p></>;
  const houseShare = share(profile.housingTypes, "Maison"); const ownerShare = share(profile.tenure, "Propri"); const vacantShare = share(profile.occupancy, "Vacant");
  return <><div className={styles.liveReportHeading}><div><p className={styles.liveReportKicker}>Portrait résidentiel INSEE</p><h2>{profile.cityName}, en données</h2></div><span className={styles.inseeVintage}>Millésime {profile.vintage}</span></div><div className={styles.inseeKpis}><span><strong>{formatNumber(profile.totalHousing)}</strong><small>logements recensés</small></span><span><strong>{houseShare.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %</strong><small>de maisons</small></span><span><strong>{ownerShare.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %</strong><small>de propriétaires</small></span><span><strong>{vacantShare.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %</strong><small>de logements vacants</small></span></div><div className={styles.inseeCharts}><DistributionPreview items={profile.housingTypes} title="Typologie du parc" /><DistributionPreview items={profile.occupancy} title="Occupation" /><DistributionPreview items={profile.tenure} title="Statut d’occupation" /><DistributionPreview items={profile.construction} title="Périodes de construction" /></div><p className={styles.inseeSource}>Source : INSEE, Recensement de la population {profile.vintage}, code commune {profile.inseeCode}.</p></>;
}
function DistributionPreview({ items, title }: { items: InseeDistributionItem[]; title: string }) { const total = items.reduce((sum, item) => sum + item.value, 0); return <section><h3>{title}</h3>{items.slice(0, 6).map((item) => { const value = total ? item.value / total * 100 : 0; return <div className={styles.inseeBar} key={item.label}><span>{item.label}</span><strong>{value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %</strong><i><b style={{ width: `${Math.max(1, value)}%` }} /></i></div>; })}</section>; }
function ReportBlockRow({ block, index, label, length, move, toggle }: { block: EstimationReportBlock; index: number; label: string; length: number; move: (index: number, direction: -1 | 1) => void; toggle: (index: number) => void }) { return <article data-disabled={!block.enabled || undefined}><span>{String(index + 1).padStart(2, "0")}</span><a href={`#report-${block.id}`}>{label}</a><div><button aria-label={`Monter ${label}`} disabled={index === 0} onClick={() => move(index, -1)} type="button"><ArrowUp size={16} /></button><button aria-label={`Descendre ${label}`} disabled={index === length - 1} onClick={() => move(index, 1)} type="button"><ArrowDown size={16} /></button><button aria-label={block.enabled ? `Masquer ${label}` : `Afficher ${label}`} onClick={() => toggle(index)} type="button">{block.enabled ? <Eye size={16} /> : <EyeOff size={16} />}</button></div></article>; }

function hydrateWorkspace(workspace: EstimationAgentWorkspace): EstimationAgentWorkspace { const result = workspace.draft_result_payload; return { ...workspace, agent_analysis: workspace.agent_analysis || `Le bien bénéficie d’un positionnement à analyser au regard de son adresse, de ses volumes et des références disponibles. La valeur centrale de ${formatCurrency(workspace.median_price)} constitue un repère de travail à confirmer lors de la visite.`, strengths: workspace.strengths || result.positiveFactors.join("\n"), reservations: workspace.reservations || result.negativeFactors.join("\n"), sale_strategy: workspace.sale_strategy || "Après validation de l’avis de valeur, nous construirons un lancement cohérent : préparation du bien, présentation soignée, diffusion ciblée, qualification des acquéreurs et suivi de la négociation jusqu’à la signature." }; }
function chartGeometry(points: Array<{ label: string; value: number }>) { if (points.length < 2) return { delta: 0, path: "" }; const values = points.map((point) => point.value); const min = Math.min(...values); const max = Math.max(...values); const range = Math.max(1, max - min); const path = points.map((point, index) => `${index ? "L" : "M"} ${20 + index / (points.length - 1) * 680} ${25 + (max - point.value) / range * 170}`).join(" "); return { delta: (values.at(-1)! - values[0]) / values[0] * 100, path }; }
function toCityHistory(points: Array<{ period: string; value: number }>, propertyType: "apartment" | "house"): CityPriceHistoryPoint[] { return points.map((point) => ({ period: point.period, apartment: propertyType === "apartment" ? point.value : 0, house: propertyType === "house" ? point.value : 0 })); }
function share(items: InseeDistributionItem[], needle: string) { const total = items.reduce((sum, item) => sum + item.value, 0); const matching = items.filter((item) => item.label.toLocaleLowerCase("fr").includes(needle.toLocaleLowerCase("fr"))).reduce((sum, item) => sum + item.value, 0); return total ? matching / total * 100 : 0; }
function propertyLabel(value: string) { return value === "house" ? "Maison" : "Appartement"; }
function conditionLabel(value?: string) { return ({ new: "Excellent état", good: "Bon état", refresh: "À rafraîchir", renovate: "À rénover" } as Record<string, string>)[value ?? ""] ?? "Non renseigné"; }
function percent(value?: number) { return value === undefined ? "Non disponible" : `${value > 0 ? "+" : ""}${value.toLocaleString("fr-FR")} %`; }
function formatCurrency(value: number) { return `${formatNumber(Math.round(value))} €`; }
function formatNumber(value: number) { return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value); }
function formatDistance(value: number) { return value >= 1000 ? `${(value / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} km` : `${formatNumber(value)} m`; }
function shortPeriod(value: string) { const date = new Date(`${value.length === 4 ? `${value}-01` : value}-01`); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" }).format(date); }
