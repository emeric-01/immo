import { NextResponse, type NextRequest } from "next/server";
import { getClientSession } from "@/lib/client-access/auth";
import { getClientBuyerSearch, getClientBuyerSearches } from "@/lib/client-access/project";

export async function GET(request: NextRequest) {
  const session = await getClientSession();

  if (!session) {
    return NextResponse.json({ error: "Acces client requis." }, { status: 401 });
  }

  const searchId = request.nextUrl.searchParams.get("id")?.trim();

  if (!searchId) {
    const searches = await getClientBuyerSearches(session);
    const latestContact = searches[0]?.raw_payload?.contact;

    return NextResponse.json({
      contact: latestContact
        ? {
            ...latestContact,
            email: session.email,
            firstName: session.firstName,
            lastName: session.lastName,
            phone: session.phone || latestContact.phone,
          }
        : undefined,
      profile: {
        email: session.email,
        firstName: session.firstName,
        lastName: session.lastName,
        phone: session.phone,
      },
    });
  }

  const result = await getClientBuyerSearch(session, searchId);

  if (result.status !== "ready") {
    return NextResponse.json({ error: result.message }, { status: result.status === "not_found" ? 404 : 502 });
  }

  return NextResponse.json({
    id: result.data.id,
    search: result.data.raw_payload,
  });
}
