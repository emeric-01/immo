import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { hasAdminPermission } from "@/lib/admin/permissions";
import { propertyPdfFileName, renderPropertyPdf } from "@/lib/property-pdf";
import { getAdminProperty } from "@/lib/properties";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!(await hasAdminPermission(session, "properties:read"))) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const property = await getAdminProperty((await params).id);
    if (!property) return NextResponse.json({ error: "Bien introuvable" }, { status: 404 });

    const pdf = await renderPropertyPdf(property);
    const fileName = propertyPdfFileName(property);

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    console.error("Property PDF generation failed", error);
    return NextResponse.json({ error: "La fiche PDF n’a pas pu être générée." }, { status: 500 });
  }
}
