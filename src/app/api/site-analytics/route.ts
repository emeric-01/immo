import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { adminRest } from "@/lib/properties";

const allowedEvents = new Set(["page_view", "conversion"]);

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && new URL(origin).host !== new URL(request.url).host) return new NextResponse(null, { status: 204 });
    const body = await request.json() as { eventType?: string; path?: string; referrer?: string; sessionId?: string; visitorId?: string };
    if (!body.eventType || !allowedEvents.has(body.eventType) || !body.path?.startsWith("/") || body.path.length > 300 || !body.visitorId || body.visitorId.length > 100) return new NextResponse(null, { status: 204 });
    const userAgent = request.headers.get("user-agent") ?? "";
    const secret = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "site-analytics";
    const hash = (value: string) => createHash("sha256").update(`${secret}:${value}`).digest("hex");
    const visitorHash = hash(body.visitorId);
    const sessionHash = body.sessionId ? hash(body.sessionId) : null;
    const bucket = Math.floor(Date.now() / (body.eventType === "page_view" ? 30 * 60_000 : 5 * 60_000));
    const dedupeKey = hash(`${body.eventType}:${body.path}:${visitorHash}:${bucket}`);
    const referrerHost = (() => { try { if (!body.referrer) return null; const host = new URL(body.referrer).hostname.slice(0, 120); return host === new URL(request.url).hostname ? "Navigation interne" : host; } catch { return null; } })();
    const deviceType = /ipad|tablet/i.test(userAgent) ? "tablet" : /mobile|iphone|android/i.test(userAgent) ? "mobile" : "desktop";
    await adminRest("site_analytics_events?on_conflict=dedupe_key", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify({ event_type: body.eventType, audience_type: "human", path: body.path, visitor_hash: visitorHash, session_hash: sessionHash, referrer_host: referrerHost, device_type: deviceType, dedupe_key: dedupeKey }) });
    return new NextResponse(null, { status: 204 });
  } catch { return new NextResponse(null, { status: 204 }); }
}
