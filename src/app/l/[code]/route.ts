import { NextResponse } from "next/server";
import { getAdminAttributionLinkByCode } from "@/lib/admin/users";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const code = (await params).code.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{2,39}$/.test(code)) return NextResponse.redirect(new URL("/", request.url));

  const link = await getAdminAttributionLinkByCode(code);
  if (!link) return NextResponse.redirect(new URL("/", request.url));

  if (!/^\/(?!\/)/.test(link.landing_path)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const destination = new URL(link.landing_path, request.url);
  if (destination.origin !== new URL(request.url).origin) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  destination.searchParams.set("ref", link.code);
  destination.searchParams.set("utm_source", link.utm_source);
  destination.searchParams.set("utm_medium", link.utm_medium);
  destination.searchParams.set("utm_campaign", link.utm_campaign);
  return NextResponse.redirect(destination, 307);
}
