import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { hasAdminPermission } from "@/lib/admin/permissions";
import { getEnabledWorkspacePhotoBuffers, getEstimationAgentWorkspace, workspaceEstimation } from "@/lib/admin/estimation-workspaces";
import { getAdminUserSummary } from "@/lib/admin/users";
import { getInseeHousingProfile } from "@/lib/insee-housing";
import { estimationPdfFileName, renderWorkspaceEstimationPdf } from "@/lib/estimation-pdf";
import { listEstimationReportSnapshots, nextReportVersion, saveEstimationReportSnapshot } from "@/lib/admin/estimation-reports";
import { getStaticMapImage } from "@/lib/mapbox-static";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!(await hasAdminPermission(session, "estimations:read"))) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  try {
    const { id } = await params;
    const dossier = await getEstimationAgentWorkspace(id, session);
    if (!dossier) return NextResponse.json({ error: "Dossier professionnel introuvable" }, { status: 404 });
    const { source, workspace } = dossier;
    const estimation = workspaceEstimation(source, workspace);
    const agentId = workspace.assigned_admin_user_id || source.assigned_admin_user_id || source.attributed_admin_user_id || source.created_by_admin_user_id;
    const [agent, inseeProfile, snapshots, photos, mapImage] = await Promise.all([getAdminUserSummary(agentId), getInseeHousingProfile(source.input_payload.selectedAddress?.inseeCode), listEstimationReportSnapshots(source.id), getEnabledWorkspacePhotoBuffers(workspace), getStaticMapImage(estimation.result_payload.coordinates)]);
    const version = nextReportVersion(snapshots);
    const pdf = await renderWorkspaceEstimationPdf(estimation, workspace, agent, { inseeProfile, mapImage, photos, reportVersion: version });
    await saveEstimationReportSnapshot({ estimation, inseeProfile, pdf, session, version, workspace });
    return new Response(new Uint8Array(pdf), { headers: { "Cache-Control": "private, no-store, max-age=0", "Content-Disposition": `attachment; filename="${estimationPdfFileName(estimation)}"`, "Content-Type": "application/pdf", "X-Report-Version": String(version) } });
  } catch (error) {
    console.error("Workspace PDF generation failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Le rapport PDF n’a pas pu être généré." }, { status: 500 });
  }
}
