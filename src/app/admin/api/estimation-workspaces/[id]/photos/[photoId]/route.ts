import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { hasAdminPermission } from "@/lib/admin/permissions";
import { downloadEstimationWorkspacePhoto, getEstimationAgentWorkspace } from "@/lib/admin/estimation-workspaces";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; photoId: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!(await hasAdminPermission(session, "estimations:read"))) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  try {
    const { id, photoId } = await params;
    const dossier = await getEstimationAgentWorkspace(id, session);
    if (!dossier) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
    const { buffer, photo } = await downloadEstimationWorkspacePhoto(dossier.workspace, photoId);
    return new Response(new Uint8Array(buffer), { headers: { "Cache-Control": "private, max-age=300", "Content-Disposition": `inline; filename="${encodeURIComponent(photo.name)}"`, "Content-Type": photo.contentType } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Photo introuvable" }, { status: 404 });
  }
}
