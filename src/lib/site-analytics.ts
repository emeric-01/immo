import "server-only";
import { adminRest } from "@/lib/properties";

type SiteAnalyticsEvent = {
  audience_type: "human" | "bot" | "suspected";
  bot_name: string | null;
  created_at: string;
  device_type: "mobile" | "tablet" | "desktop";
  event_type: "page_view" | "conversion";
  path: string;
  referrer_host: string | null;
  session_hash: string | null;
  visitor_hash: string | null;
};

export type SiteAnalyticsSummary = {
  totals: { humanViews: number; botViews: number; suspectedViews: number; uniqueVisitors: number; conversions: number; conversionRate: number };
  daily: Array<{ date: string; humains: number; visiteurs: number; robots: number; incertains: number }>;
  audience: Array<{ name: string; value: number; color: string }>;
  devices: Array<{ name: string; value: number }>;
  pages: Array<{ name: string; value: number }>;
  sources: Array<{ name: string; value: number }>;
  bots: Array<{ name: string; value: number }>;
  channels: Array<{ name: string; value: number }>;
  campaigns: Array<{ name: string; value: number }>;
  conversionKinds: Array<{ name: string; value: number }>;
};

type AttributionTouch = { source: string; medium: string; campaign: string | null; created_at: string; is_entry: boolean };
type AnalyticsEvent = SiteAnalyticsEvent & { conversion_kind?: string | null };

const ANALYTICS_PAGE_SIZE = 1_000;

async function getAllAnalyticsRows<T>(query: string) {
  const rows: T[] = [];

  for (let offset = 0; ; offset += ANALYTICS_PAGE_SIZE) {
    const page = await adminRest<T[]>(`${query}&limit=${ANALYTICS_PAGE_SIZE}&offset=${offset}`);
    rows.push(...page);
    if (page.length < ANALYTICS_PAGE_SIZE) return rows;
  }
}

function count(values: string[], limit = 8) {
  return [...values.reduce((map, value) => map.set(value, (map.get(value) ?? 0) + 1), new Map<string, number>())]
    .sort((a, b) => b[1] - a[1]).slice(0, limit).map(([name, value]) => ({ name, value }));
}

export async function getSiteAnalytics(days = 30): Promise<SiteAnalyticsSummary> {
  const safeDays = [7, 30, 90].includes(days) ? days : 30;
  const since = new Date(Date.now() - safeDays * 86_400_000).toISOString();
  const [events, touches] = await Promise.all([
    getAllAnalyticsRows<AnalyticsEvent>(`site_analytics_events?created_at=gte.${encodeURIComponent(since)}&select=audience_type,bot_name,created_at,device_type,event_type,path,referrer_host,session_hash,visitor_hash,conversion_kind&order=id.asc`),
    getAllAnalyticsRows<AttributionTouch>(`attribution_touches?created_at=gte.${encodeURIComponent(since)}&is_entry=eq.true&select=source,medium,campaign,created_at,is_entry&order=id.asc`).catch(() => []),
  ]);
  const views = events.filter((event) => event.event_type === "page_view");
  const humans = views.filter((event) => event.audience_type === "human");
  const bots = views.filter((event) => event.audience_type === "bot");
  const suspected = views.filter((event) => event.audience_type === "suspected");
  const conversions = events.filter((event) => event.event_type === "conversion" && event.audience_type === "human");
  const dailyMap = new Map<string, { humains: number; robots: number; incertains: number }>();
  const dailyVisitors = new Map<string, Set<string>>();
  for (let index = safeDays - 1; index >= 0; index--) {
    const date = new Date(Date.now() - index * 86_400_000).toISOString().slice(0, 10);
    dailyMap.set(date, { humains: 0, robots: 0, incertains: 0 });
    dailyVisitors.set(date, new Set());
  }
  for (const event of views) {
    const date = event.created_at.slice(0, 10);
    const day = dailyMap.get(date);
    if (!day) continue;
    if (event.audience_type === "human") {
      day.humains++;
      if (event.visitor_hash) dailyVisitors.get(date)?.add(event.visitor_hash);
    }
    else if (event.audience_type === "bot") day.robots++;
    else day.incertains++;
  }
  const uniqueVisitors = new Set(humans.map((event) => event.visitor_hash).filter(Boolean)).size;
  return {
    totals: { humanViews: humans.length, botViews: bots.length, suspectedViews: suspected.length, uniqueVisitors, conversions: conversions.length, conversionRate: humans.length ? Number((conversions.length / humans.length * 100).toFixed(1)) : 0 },
    daily: [...dailyMap].map(([date, values]) => ({ date: date.slice(5), ...values, visiteurs: dailyVisitors.get(date)?.size ?? 0 })),
    audience: [{ name: "Humains", value: humans.length, color: "#b77547" }, { name: "Robots identifiés", value: bots.length, color: "#171512" }, { name: "Trafic incertain", value: suspected.length, color: "#c9bfb4" }],
    devices: count(humans.map((event) => event.device_type)),
    pages: count(humans.map((event) => event.path), 10),
    sources: count(humans.map((event) => event.referrer_host || "Accès direct"), 8),
    bots: count(bots.map((event) => event.bot_name || "Robot non identifié"), 8),
    channels: count(touches.map((touch) => channelLabel(touch.medium)), 8),
    campaigns: count(touches.map((touch) => touch.campaign).filter((value): value is string => Boolean(value)), 8),
    conversionKinds: count(conversions.map((event) => event.conversion_kind === "estimation" ? "Estimations" : event.conversion_kind === "buyer_search" ? "Recherches" : "Contacts"), 8),
  };
}

function channelLabel(medium: string) {
  if (medium === "organic") return "Organic";
  if (medium === "social") return "Social";
  if (/cpc|ppc|paid|display/.test(medium)) return "Paid";
  if (medium === "referral") return "Referral / apporteur";
  if (medium === "none") return "Direct";
  return "Campagne";
}
