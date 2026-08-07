import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/admin/auth";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { getAdminEstimation } from "@/lib/admin/estimations";
import { getWorkspaceBySourceEstimation } from "@/lib/admin/estimation-workspaces";
import { AgentWorkspaceEditor } from "./AgentWorkspaceEditor";
import { listEstimationReportSnapshots } from "@/lib/admin/estimation-reports";

export const metadata: Metadata = { title: "Dossier d’estimation professionnel | Admin" };
export const dynamic = "force-dynamic";

export default async function EstimationWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession(); await requireAdminPermission(session, "estimations:read");
  const { id } = await params;
  const [sourceState, workspace] = await Promise.all([getAdminEstimation(id, session), getWorkspaceBySourceEstimation(id, session)]);
  if (sourceState.status !== "ready" || !sourceState.data || !workspace) return <main>Le dossier professionnel n’existe pas encore.</main>;
  const source = sourceState.data;
  const generated = source.generated_result_payload ?? source.result_payload;
  const snapshots = await listEstimationReportSnapshots(source.id, workspace.id);
  return <AgentWorkspaceEditor estimationId={source.id} initial={workspace} original={{ high: source.generated_high_price ?? generated.highPrice, low: source.generated_low_price ?? generated.lowPrice, median: source.generated_median_price ?? generated.medianPrice, pricePerM2: generated.pricePerM2 }} snapshots={snapshots} />;
}
