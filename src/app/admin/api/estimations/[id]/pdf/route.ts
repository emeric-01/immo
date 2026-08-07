import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { getAdminEstimation } from "@/lib/admin/estimations";
import { hasAdminPermission } from "@/lib/admin/permissions";
import { getAdminUserSummary } from "@/lib/admin/users";
import { estimationPdfFileName, renderEstimationPdf } from "@/lib/estimation-pdf";
import { getInseeHousingProfile } from "@/lib/insee-housing";
import { listEstimationReportSnapshots, nextReportVersion, saveEstimationReportSnapshot } from "@/lib/admin/estimation-reports";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!(await hasAdminPermission(session, "estimations:read"))) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const result = await getAdminEstimation(id, session);
    if (result.status !== "ready" || !result.data) {
      return NextResponse.json({ error: "Estimation introuvable" }, { status: 404 });
    }

    const estimation = result.data;
    const agentId = estimation.assigned_admin_user_id || estimation.attributed_admin_user_id || estimation.created_by_admin_user_id;
    const agent = await getAdminUserSummary(agentId);
    const inseeCode = estimation.input_payload.selectedAddress?.inseeCode;
    const [inseeProfile, snapshots] = await Promise.all([
      getInseeHousingProfile(inseeCode),
      listEstimationReportSnapshots(estimation.id),
    ]);
    const version = nextReportVersion(snapshots);
    const pdf = await renderEstimationPdf(estimation, agent, { inseeProfile, reportVersion: version });
    await saveEstimationReportSnapshot({ estimation, inseeProfile, pdf, session, version });

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Disposition": `attachment; filename="${estimationPdfFileName(estimation)}"`,
        "Content-Type": "application/pdf",
        "X-Report-Version": String(version),
      },
    });
  } catch (error) {
    console.error("Estimation PDF generation failed", error);
    return NextResponse.json({ error: "Le rapport PDF n’a pas pu être généré." }, { status: 500 });
  }
}
