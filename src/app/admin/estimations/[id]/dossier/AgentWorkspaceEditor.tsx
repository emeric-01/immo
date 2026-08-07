"use client";

import { useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, CheckCircle2, Download, Eye, EyeOff, LoaderCircle, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EstimationAgentWorkspace, WorkspaceUpdate } from "@/lib/admin/estimation-workspaces";
import { reportBlockDefinitions, type EstimationReportBlock } from "@/lib/estimation-report-config";
import styles from "../../../admin.module.css";
import type { EstimationReportSnapshot } from "@/lib/admin/estimation-reports";

type Original = { high: number; low: number; median: number; pricePerM2: number };
const reportBlockLabels = new Map(reportBlockDefinitions.map((block) => [block.id, block.label]));

export function AgentWorkspaceEditor({ estimationId, initial, original, snapshots }: { estimationId: string; initial: EstimationAgentWorkspace; original: Original; snapshots: EstimationReportSnapshot[] }) {
  const router = useRouter();
  const [workspace, setWorkspace] = useState(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error" | "pdf">("idle");
  const [message, setMessage] = useState("");

  function patch<K extends keyof EstimationAgentWorkspace>(key: K, value: EstimationAgentWorkspace[K]) { setWorkspace((current) => ({ ...current, [key]: value })); setState("idle"); }
  function move(index: number, direction: -1 | 1) { const target = index + direction; if (target < 0 || target >= workspace.report_blocks.length) return; const blocks = [...workspace.report_blocks]; [blocks[index], blocks[target]] = [blocks[target], blocks[index]]; patch("report_blocks", blocks); }
  function toggle(index: number) { patch("report_blocks", workspace.report_blocks.map((block, position) => position === index ? { ...block, enabled: !block.enabled } : block)); }

  async function persist() {
    setState("saving"); setMessage("");
    const payload: WorkspaceUpdate = { agent_analysis: workspace.agent_analysis, high_price: Number(workspace.high_price), low_price: Number(workspace.low_price), median_price: Number(workspace.median_price), report_blocks: workspace.report_blocks, reservations: workspace.reservations, sale_strategy: workspace.sale_strategy, status: workspace.status, strengths: workspace.strengths, title: workspace.title };
    const response = await fetch(`/api/admin/estimation-workspaces/${workspace.id}`, { method: "PATCH", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    const data = await response.json().catch(() => null) as { error?: string; workspace?: EstimationAgentWorkspace } | null;
    if (!response.ok || !data?.workspace) throw new Error(data?.error || "Enregistrement impossible.");
    setWorkspace(data.workspace); setState("saved"); setMessage("Dossier professionnel enregistré."); router.refresh();
    return data.workspace;
  }

  async function save() { try { await persist(); } catch (cause) { setState("error"); setMessage(cause instanceof Error ? cause.message : "Enregistrement impossible."); } }
  async function generatePdf() {
    try {
      await persist(); setState("pdf"); setMessage("Création et archivage du rapport…");
      const response = await fetch(`/admin/api/estimation-workspaces/${workspace.id}/pdf`, { method: "POST" });
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || "Génération impossible.");
      const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement("a");
      link.href = url; link.download = response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? `estimation-${workspace.id}.pdf`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      setState("saved"); setMessage(`Rapport version ${response.headers.get("X-Report-Version") ?? "nouvelle"} archivé et téléchargé.`); router.refresh();
    } catch (cause) { setState("error"); setMessage(cause instanceof Error ? cause.message : "Génération impossible."); }
  }

  return <main className={styles.detailPage}><div className={styles.detailShell}>
    <section className={styles.workspaceHero}><div><Link className={styles.backLink} href={`/admin/estimations/${estimationId}`}><ArrowLeft size={18} />Voir l’estimation originale</Link><p className={styles.eyebrow}>Dossier professionnel de l’agent</p><input className={styles.workspaceTitleInput} value={workspace.title} onChange={(event) => patch("title", event.target.value)} /></div><div className={styles.workspaceActions}><label className={styles.workspaceStatus}>État<select value={workspace.status} onChange={(event) => patch("status", event.target.value as EstimationAgentWorkspace["status"])}><option value="draft">Brouillon</option><option value="ready">Prêt à présenter</option><option value="archived">Archivé</option></select></label><button className={styles.secondaryButton} disabled={state === "saving" || state === "pdf"} onClick={save} type="button">{state === "saving" ? <LoaderCircle className={styles.spin} size={18} /> : <Save size={18} />}Enregistrer</button><button className={styles.primaryButton} disabled={state === "saving" || state === "pdf"} onClick={generatePdf} type="button">{state === "pdf" ? <LoaderCircle className={styles.spin} size={18} /> : <Download size={18} />}Créer une version PDF</button></div></section>

    <section className={styles.workspaceOrigin}><div><p className={styles.eyebrow}>Source verrouillée</p><h2>Estimation automatique initiale</h2><p>Cette référence reste intacte, quelles que soient les modifications apportées dans ce dossier.</p></div><div><Value label="Basse" value={original.low} /><Value label="Centrale" value={original.median} /><Value label="Haute" value={original.high} /><Value label="Prix au m²" value={original.pricePerM2} suffix=" €/m²" /></div></section>

    <div className={styles.workspaceGrid}>
      <section className={styles.workspaceForm}><header><p className={styles.eyebrow}>Version de travail</p><h2>Analyse et positionnement de l’agent</h2></header><div className={styles.workspacePriceGrid}><PriceInput label="Fourchette basse" value={workspace.low_price} onChange={(value) => patch("low_price", value)} /><PriceInput label="Valeur centrale" value={workspace.median_price} onChange={(value) => patch("median_price", value)} /><PriceInput label="Fourchette haute" value={workspace.high_price} onChange={(value) => patch("high_price", value)} /></div><TextArea label="Analyse professionnelle" hint="Votre lecture du bien, de son emplacement et de son positionnement." value={workspace.agent_analysis} onChange={(value) => patch("agent_analysis", value)} /><div className={styles.workspaceTextColumns}><TextArea label="Points forts" value={workspace.strengths} onChange={(value) => patch("strengths", value)} /><TextArea label="Points de vigilance" value={workspace.reservations} onChange={(value) => patch("reservations", value)} /></div><TextArea label="Stratégie de commercialisation" hint="Prix de lancement, présentation, diffusion et cible acquéreur." value={workspace.sale_strategy} onChange={(value) => patch("sale_strategy", value)} /></section>

      <aside className={styles.reportComposer}><header><p className={styles.eyebrow}>Composition du PDF</p><h2>Ordre des informations</h2><p>Déplacez les blocs et masquez ceux qui ne sont pas utiles pour ce propriétaire.</p></header><div className={styles.reportBlockList}>{workspace.report_blocks.map((block, index) => <ReportBlockRow block={block} index={index} key={block.id} label={reportBlockLabels.get(block.id) ?? block.id} length={workspace.report_blocks.length} move={move} toggle={toggle} />)}</div><div className={styles.reportPreviewNote}><CheckCircle2 size={18} /><span>La couverture reste toujours en première page. L’ordre affiché ci-dessus est ensuite repris dans le PDF.</span></div></aside>
    </div>
    {message ? <p className={state === "error" ? styles.errorText : styles.successText}>{message}</p> : null}
    <section className={styles.reportHistory}><header><p className={styles.eyebrow}>Versions figées</p><h2>Rapports déjà remis</h2><p>Chaque version conserve son contenu, son ordre et ses données au moment exact de la génération.</p></header>{snapshots.length ? <div className={styles.adminComparableList}>{snapshots.map((snapshot) => <article key={snapshot.id}><div><strong>Version {snapshot.version}</strong><span>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(snapshot.created_at))} · archive immuable</span></div><a className={styles.backLink} href={`/admin/api/estimations/${estimationId}/pdf/${snapshot.id}`}><Download size={16} />Télécharger</a></article>)}</div> : <p className={styles.helpText}>Aucune version générée pour le moment.</p>}</section>
  </div></main>;
}

function Value({ label, suffix = " €", value }: { label: string; suffix?: string; value: number }) { return <span><small>{label}</small><strong>{formatNumber(value)}{suffix}</strong></span>; }
function PriceInput({ label, onChange, value }: { label: string; onChange: (value: number) => void; value: number }) { return <label>{label}<div><input min="0" onChange={(event) => onChange(Number(event.target.value))} step="100" type="number" value={value} /><span>€</span></div></label>; }
function TextArea({ hint, label, onChange, value }: { hint?: string; label: string; onChange: (value: string) => void; value: string }) { return <label className={styles.workspaceTextarea}><span>{label}</span>{hint ? <small>{hint}</small> : null}<textarea rows={5} value={value} onChange={(event) => onChange(event.target.value)} /></label>; }
function ReportBlockRow({ block, index, label, length, move, toggle }: { block: EstimationReportBlock; index: number; label: string; length: number; move: (index: number, direction: -1 | 1) => void; toggle: (index: number) => void }) { return <article data-disabled={!block.enabled || undefined}><span>{String(index + 1).padStart(2, "0")}</span><strong>{label}</strong><div><button aria-label={`Monter ${label}`} disabled={index === 0} onClick={() => move(index, -1)} type="button"><ArrowUp size={16} /></button><button aria-label={`Descendre ${label}`} disabled={index === length - 1} onClick={() => move(index, 1)} type="button"><ArrowDown size={16} /></button><button aria-label={block.enabled ? `Masquer ${label}` : `Afficher ${label}`} onClick={() => toggle(index)} type="button">{block.enabled ? <Eye size={16} /> : <EyeOff size={16} />}</button></div></article>; }
function formatNumber(value: number) { return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value); }
