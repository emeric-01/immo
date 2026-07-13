import { NextResponse } from "next/server";
import { getClientSession } from "@/lib/client-access/auth";
import { getClientBuyerSearch } from "@/lib/client-access/project";

export async function GET() {
  const session = await getClientSession();

  if (!session) {
    return NextResponse.json({ error: "Acces client requis." }, { status: 401 });
  }

  const result = await getClientBuyerSearch(session);

  if (result.status !== "ready") {
    return NextResponse.json({ error: result.message }, { status: result.status === "not_found" ? 404 : 502 });
  }

  return NextResponse.json({
    id: result.data.id,
    reference: result.data.client_reference,
    search: result.data.raw_payload,
  });
}
