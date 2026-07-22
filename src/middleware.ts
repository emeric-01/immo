import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";

const botRules: Array<[RegExp, string]> = [
  [/googlebot/i, "Googlebot"], [/bingbot/i, "Bingbot"], [/applebot/i, "Applebot"], [/yandexbot/i, "Yandex"],
  [/duckduckbot/i, "DuckDuckBot"], [/facebookexternalhit|meta-externalagent/i, "Meta"], [/linkedinbot/i, "LinkedIn"],
  [/ahrefsbot/i, "Ahrefs"], [/semrushbot/i, "Semrush"], [/mj12bot/i, "Majestic"], [/bot|crawler|spider|headless/i, "Autre robot"],
];

async function digest(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function middleware(request: NextRequest, event: NextFetchEvent) {
  const userAgent = request.headers.get("user-agent") ?? "";
  const match = botRules.find(([pattern]) => pattern.test(userAgent));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (match && url && key) {
    event.waitUntil((async () => {
      const hour = new Date().toISOString().slice(0, 13);
      const path = request.nextUrl.pathname.slice(0, 300);
      const dedupeKey = await digest(`${match[1]}:${path}:${hour}`);
      await fetch(`${url}/rest/v1/site_analytics_events?on_conflict=dedupe_key`, { method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify({ event_type: "page_view", audience_type: "bot", bot_name: match[1], path, device_type: "desktop", dedupe_key: dedupeKey }) }).catch(() => undefined);
    })());
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!admin|api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|woff2)$).*)"] };
