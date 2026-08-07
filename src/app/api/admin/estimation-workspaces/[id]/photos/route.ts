import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { hasAdminPermission } from "@/lib/admin/permissions";
import { deleteEstimationWorkspacePhoto, uploadEstimationWorkspacePhoto } from "@/lib/admin/estimation-workspaces";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function authorized() {
  const session = await getAdminSession();
  if (!session) return { response: NextResponse.json({ error: "Non autorisé" }, { status: 401 }) };
  if (!(await hasAdminPermission(session, "estimations:read"))) return { response: NextResponse.json({ error: "Accès refusé" }, { status: 403 }) };
  return { session };
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorized();
  if ("response" in auth) return auth.response;
  try {
    const { id } = await params;
    const form = await request.formData();
    const file = form.get("photo");
    if (!(file instanceof File)) return NextResponse.json({ error: "Sélectionnez une photo." }, { status: 400 });
    const workspace = await uploadEstimationWorkspacePhoto(id, file, auth.session);
    return NextResponse.json({ workspace });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Envoi impossible." }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorized();
  if ("response" in auth) return auth.response;
  try {
    const { id } = await params;
    const body = await request.json() as { photoId?: string };
    if (!body.photoId) return NextResponse.json({ error: "Photo manquante." }, { status: 400 });
    const workspace = await deleteEstimationWorkspacePhoto(id, body.photoId, auth.session);
    return NextResponse.json({ workspace });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Suppression impossible." }, { status: 400 });
  }
}
