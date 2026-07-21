import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { adminRest } from "@/lib/properties";

const allowedEvents = new Set(["view", "visit_request", "phone_click", "email_click"]);
const botPattern = /bot|crawler|spider|headless|preview|facebookexternalhit|whatsapp/i;

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && new URL(origin).host !== new URL(request.url).host) return new NextResponse(null, { status: 204 });
    const userAgent = request.headers.get("user-agent") ?? "";
    if (botPattern.test(userAgent)) return new NextResponse(null, { status: 204 });
    const body = await request.json() as { propertyId?: string; eventType?: string; visitorId?: string; referrer?: string };
    if (!body.propertyId || !body.eventType || !body.visitorId || !allowedEvents.has(body.eventType) || body.visitorId.length > 100) return NextResponse.json({ error: "Événement invalide" }, { status: 400 });
    const secret = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "property-analytics";
    const visitorHash = createHash("sha256").update(`${secret}:${body.visitorId}`).digest("hex");
    const bucketMs = body.eventType === "view" ? 60 * 60 * 1000 : 5 * 60 * 1000;
    const bucket = Math.floor(Date.now() / bucketMs);
    const dedupeKey = createHash("sha256").update(`${body.propertyId}:${body.eventType}:${visitorHash}:${bucket}`).digest("hex");
    const referrerHost = (() => {
      try {
        if (!body.referrer) return null;
        const hostname = new URL(body.referrer).hostname.slice(0, 120);
        return hostname === new URL(request.url).hostname ? "Navigation interne" : hostname;
      } catch {
        return null;
      }
    })();
    const deviceType = /ipad|tablet/i.test(userAgent) ? "tablet" : /mobile|iphone|android/i.test(userAgent) ? "mobile" : "desktop";
    await adminRest("property_analytics_events?on_conflict=dedupe_key", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify({ property_id: body.propertyId, event_type: body.eventType, visitor_hash: visitorHash, dedupe_key: dedupeKey, referrer_host: referrerHost, device_type: deviceType }) });
    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
