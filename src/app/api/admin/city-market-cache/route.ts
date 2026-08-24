import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";

export async function POST(request: Request) {
  const session = await getAdminSession();
  const bearerToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const adminToken = process.env.ADMIN_ACCESS_TOKEN?.trim();

  if (!session && (!adminToken || bearerToken !== adminToken)) {
    return NextResponse.json({ message: "Accès refusé." }, { status: 401 });
  }

  return NextResponse.json({
    message:
      "Le rafraîchissement Immo Data est désactivé. Les repères publiés sont désormais alimentés par le pipeline DVF contrôlé.",
  }, { status: 410 });
}
