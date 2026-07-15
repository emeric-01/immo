import { NextResponse } from "next/server";
import { getClientSession } from "@/lib/client-access/auth";
import { softDeleteClientBuyerSearch } from "@/lib/client-access/project";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getClientSession();

  if (!session) {
    return NextResponse.json({ error: "Acces client requis." }, { status: 401 });
  }

  const { id } = await params;
  const searchId = id.trim();

  if (!searchId) {
    return NextResponse.json({ error: "Recherche invalide." }, { status: 400 });
  }

  try {
    const deleted = await softDeleteClientBuyerSearch(session.id, searchId);

    if (!deleted) {
      return NextResponse.json(
        { error: "Cette recherche n'existe pas ou ne vous appartient pas." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Client search soft delete failed", error);
    return NextResponse.json(
      { error: "La recherche n'a pas pu etre supprimee. Veuillez reessayer." },
      { status: 502 },
    );
  }
}
