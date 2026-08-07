import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { hasAdminPermission } from "@/lib/admin/permissions";
import { updateEstimationAgentWorkspace, type WorkspaceUpdate } from "@/lib/admin/estimation-workspaces";
import { reportBlockDefinitions, type EstimationReportBlock } from "@/lib/estimation-report-config";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Votre session a expiré." }, { status: 401 });
  if (!(await hasAdminPermission(session, "estimations:read"))) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const body = await request.json().catch(() => null) as Partial<WorkspaceUpdate> | null;
  const parsed = parseUpdate(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    const { id } = await params;
    const workspace = await updateEstimationAgentWorkspace(id, parsed.update, session);
    return NextResponse.json({ workspace });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Enregistrement impossible." }, { status: 400 });
  }
}

function parseUpdate(body: Partial<WorkspaceUpdate> | null): { ok: true; update: WorkspaceUpdate } | { error: string; ok: false } {
  const low = Math.round(Number(body?.low_price));
  const median = Math.round(Number(body?.median_price));
  const high = Math.round(Number(body?.high_price));
  if (![low, median, high].every(Number.isFinite) || low < 0 || low > median || median > high) return { error: "La fourchette de prix est invalide.", ok: false };
  const allowed = new Set(reportBlockDefinitions.map((block) => block.id));
  const blocks = Array.isArray(body?.report_blocks) ? body.report_blocks.filter((block): block is EstimationReportBlock => Boolean(block && allowed.has(block.id) && typeof block.enabled === "boolean")) : [];
  if (blocks.length !== reportBlockDefinitions.length || new Set(blocks.map((block) => block.id)).size !== blocks.length) return { error: "La composition du rapport est invalide.", ok: false };
  const text = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
  const status = body?.status === "ready" || body?.status === "archived" ? body.status : "draft";
  return { ok: true, update: { agent_analysis: text(body?.agent_analysis, 5000), high_price: high, low_price: low, median_price: median, report_blocks: blocks, reservations: text(body?.reservations, 3000), sale_strategy: text(body?.sale_strategy, 5000), status, strengths: text(body?.strengths, 3000), title: text(body?.title, 180) || "Estimation professionnelle" } };
}
