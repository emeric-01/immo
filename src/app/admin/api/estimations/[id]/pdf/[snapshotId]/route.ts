import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { getAdminEstimation } from "@/lib/admin/estimations";
import { downloadEstimationReportSnapshot, listEstimationReportSnapshots } from "@/lib/admin/estimation-reports";
import { hasAdminPermission } from "@/lib/admin/permissions";
import { estimationPdfFileName } from "@/lib/estimation-pdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; snapshotId: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!(await hasAdminPermission(session, "estimations:read"))) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const { id, snapshotId } = await params;
  const result = await getAdminEstimation(id, session);
  if (result.status !== "ready" || !result.data) return NextResponse.json({ error: "Estimation introuvable" }, { status: 404 });
  const snapshot = (await listEstimationReportSnapshots(id)).find((row) => row.id === snapshotId);
  if (!snapshot) return NextResponse.json({ error: "Version introuvable" }, { status: 404 });
  const pdf = await downloadEstimationReportSnapshot(snapshot);
  return new Response(new Uint8Array(pdf), { headers: { "Cache-Control": "private, no-store", "Content-Disposition": `attachment; filename="v${snapshot.version}-${estimationPdfFileName(result.data)}"`, "Content-Type": "application/pdf" } });
}
