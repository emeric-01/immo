import { NextResponse } from "next/server";
import { ensureAttributionCookie, recordAttributionVisit } from "@/lib/attribution";

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && new URL(origin).host !== new URL(request.url).host) return new NextResponse(null, { status: 204 });
    const input = await request.json() as Record<string, string | null | undefined>;
    if (!input.path?.startsWith("/") || input.path.length > 300) return new NextResponse(null, { status: 204 });
    const visitorId = await ensureAttributionCookie();
    await recordAttributionVisit(visitorId, { isEntry: input.isEntry === "true", path: input.path, referrer: input.referrer, ref: input.ref, utmSource: input.utmSource, utmMedium: input.utmMedium, utmCampaign: input.utmCampaign, utmContent: input.utmContent });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Attribution visit failed", error);
    return new NextResponse(null, { status: 204 });
  }
}
