import "server-only";

import type { AdminSession } from "@/lib/admin/auth";
import { getAdminEstimation, getAdminEstimations, type AdminEstimation } from "@/lib/admin/estimations";
import type { PropertyEstimation, PropertyEstimationInput } from "@/lib/immo-data";
import { reportBlockDefinitions, type EstimationReportBlock } from "@/lib/estimation-report-config";

export type EstimationAgentWorkspace = {
  id: string;
  source_estimation_id: string;
  created_at: string;
  updated_at: string;
  created_by_admin_user_id: string | null;
  updated_by_admin_user_id: string | null;
  assigned_admin_user_id: string | null;
  status: "draft" | "ready" | "archived";
  title: string;
  draft_input_payload: PropertyEstimationInput;
  draft_result_payload: PropertyEstimation;
  low_price: number;
  median_price: number;
  high_price: number;
  price_per_m2: number;
  agent_analysis: string;
  strengths: string;
  reservations: string;
  sale_strategy: string;
  report_blocks: EstimationReportBlock[];
};

export type WorkspaceUpdate = Pick<EstimationAgentWorkspace, "agent_analysis" | "high_price" | "low_price" | "median_price" | "report_blocks" | "reservations" | "sale_strategy" | "status" | "strengths" | "title">;
export type { EstimationReportBlock } from "@/lib/estimation-report-config";

function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error("Configuration Supabase manquante");
  return { url, key };
}

function headers(key: string, extra: Record<string, string> = {}) {
  return { apikey: key, Authorization: `Bearer ${key}`, ...extra };
}

export function defaultReportBlocks(): EstimationReportBlock[] {
  return reportBlockDefinitions.map((block) => ({ enabled: true, id: block.id }));
}

export async function getWorkspaceBySourceEstimation(estimationId: string, session: AdminSession) {
  const source = await getAdminEstimation(estimationId, session);
  if (source.status !== "ready" || !source.data) return null;
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/estimation_agent_workspaces?source_estimation_id=eq.${encodeURIComponent(estimationId)}&select=*&limit=1`, { cache: "no-store", headers: headers(key) });
  if (!response.ok) throw new Error(`Lecture du dossier impossible (${response.status})`);
  const rows = await response.json() as EstimationAgentWorkspace[];
  return rows[0] ?? null;
}

export async function getEstimationAgentWorkspaces(session: AdminSession) {
  const sources = await getAdminEstimations({}, session);
  if (sources.status !== "ready") return [];
  const sourceMap = new Map(sources.data.map((source) => [source.id, source]));
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/estimation_agent_workspaces?select=*&order=updated_at.desc&limit=500`, { cache: "no-store", headers: headers(key) });
  if (!response.ok) throw new Error(`Lecture des dossiers impossible (${response.status})`);
  return (await response.json() as EstimationAgentWorkspace[]).flatMap((workspace) => {
    const source = sourceMap.get(workspace.source_estimation_id);
    return source ? [{ source, workspace: normalizeWorkspace(workspace) }] : [];
  });
}

export async function getEstimationAgentWorkspace(id: string, session: AdminSession): Promise<{ source: AdminEstimation; workspace: EstimationAgentWorkspace } | null> {
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/estimation_agent_workspaces?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { cache: "no-store", headers: headers(key) });
  if (!response.ok) throw new Error(`Lecture du dossier impossible (${response.status})`);
  const workspace = (await response.json() as EstimationAgentWorkspace[])[0];
  if (!workspace) return null;
  const source = await getAdminEstimation(workspace.source_estimation_id, session);
  if (source.status !== "ready" || !source.data) return null;
  return { source: source.data, workspace: normalizeWorkspace(workspace) };
}

export async function createEstimationAgentWorkspace(estimationId: string, session: AdminSession) {
  const existing = await getWorkspaceBySourceEstimation(estimationId, session);
  if (existing) return normalizeWorkspace(existing);
  const sourceState = await getAdminEstimation(estimationId, session);
  if (sourceState.status !== "ready" || !sourceState.data) throw new Error("Estimation source introuvable");
  const source = sourceState.data;
  const generated = source.generated_result_payload ?? source.result_payload;
  const low = source.generated_low_price ?? generated.lowPrice;
  const median = source.generated_median_price ?? generated.medianPrice;
  const high = source.generated_high_price ?? generated.highPrice;
  const adminId = session.role === "bootstrap" ? null : session.id;
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/estimation_agent_workspaces?select=*`, {
    method: "POST",
    body: JSON.stringify({
      source_estimation_id: source.id,
      created_by_admin_user_id: adminId,
      updated_by_admin_user_id: adminId,
      assigned_admin_user_id: source.assigned_admin_user_id ?? source.attributed_admin_user_id ?? adminId,
      title: `Estimation professionnelle - ${source.address_label}`,
      draft_input_payload: source.input_payload,
      draft_result_payload: generated,
      low_price: low,
      median_price: median,
      high_price: high,
      price_per_m2: Math.round(median / source.surface_m2),
      report_blocks: defaultReportBlocks(),
    }),
    headers: headers(key, { "Content-Type": "application/json", Prefer: "return=representation" }),
  });
  if (!response.ok) throw new Error(`Création du dossier impossible (${response.status}) : ${await response.text()}`);
  return normalizeWorkspace((await response.json() as EstimationAgentWorkspace[])[0]);
}

export async function updateEstimationAgentWorkspace(id: string, update: WorkspaceUpdate, session: AdminSession) {
  const current = await getEstimationAgentWorkspace(id, session);
  if (!current) throw new Error("Dossier professionnel introuvable");
  const adminId = session.role === "bootstrap" ? null : session.id;
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/estimation_agent_workspaces?id=eq.${encodeURIComponent(id)}&select=*`, {
    method: "PATCH",
    body: JSON.stringify({ ...update, price_per_m2: Math.round(update.median_price / current.source.surface_m2), updated_at: new Date().toISOString(), updated_by_admin_user_id: adminId }),
    headers: headers(key, { "Content-Type": "application/json", Prefer: "return=representation" }),
  });
  if (!response.ok) throw new Error(`Enregistrement impossible (${response.status}) : ${await response.text()}`);
  return normalizeWorkspace((await response.json() as EstimationAgentWorkspace[])[0]);
}

export function workspaceEstimation(source: AdminEstimation, workspace: EstimationAgentWorkspace): AdminEstimation {
  return {
    ...source,
    input_payload: workspace.draft_input_payload,
    result_payload: { ...workspace.draft_result_payload, highPrice: workspace.high_price, lowPrice: workspace.low_price, medianPrice: workspace.median_price, pricePerM2: workspace.price_per_m2 },
    high_price: workspace.high_price,
    low_price: workspace.low_price,
    median_price: workspace.median_price,
    price_per_m2: workspace.price_per_m2,
    range_adjusted: workspace.low_price !== (source.generated_low_price ?? source.low_price) || workspace.median_price !== (source.generated_median_price ?? source.median_price) || workspace.high_price !== (source.generated_high_price ?? source.high_price),
    updated_at: workspace.updated_at,
  };
}

function normalizeWorkspace(workspace: EstimationAgentWorkspace) {
  const validIds = new Set(reportBlockDefinitions.map(({ id }) => id));
  const ordered = (workspace.report_blocks ?? []).filter((block) => validIds.has(block.id));
  const present = new Set(ordered.map((block) => block.id));
  return { ...workspace, report_blocks: [...ordered, ...reportBlockDefinitions.filter(({ id }) => !present.has(id)).map(({ id }) => ({ id, enabled: true }))] };
}
