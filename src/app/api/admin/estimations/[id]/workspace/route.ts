import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { hasAdminPermission } from "@/lib/admin/permissions";
import { createEstimationAgentWorkspace } from "@/lib/admin/estimation-workspaces";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Votre session a expiré." }, { status: 401 });
  if (!(await hasAdminPermission(session, "estimations:read"))) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  try {
    const { id } = await params;
    const workspace = await createEstimationAgentWorkspace(id, session);
    return NextResponse.json({ id: workspace.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Création impossible." }, { status: 400 });
  }
}
