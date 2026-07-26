import "server-only";

import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { adminRest } from "@/lib/properties";

export const attributionCookieName = "lji_visitor";
const cookieLifetime = 90 * 24 * 60 * 60;

type LinkRow = {
  admin_user_id: string;
  code: string;
  id: string;
  utm_campaign: string;
  utm_content: string | null;
  utm_medium: string;
  utm_source: string;
};

type AttributionRow = {
  first_admin_user_id: string | null;
  first_campaign: string | null;
  first_content: string | null;
  first_landing_path: string;
  first_medium: string;
  first_referrer_host: string | null;
  first_source: string;
  id: string;
  last_admin_user_id: string | null;
  last_campaign: string | null;
  last_content: string | null;
  last_landing_path: string;
  last_medium: string;
  last_referrer_host: string | null;
  last_source: string;
  touch_count: number;
  visitor_hash: string;
};

export type AttributionSnapshot = {
  attributedAdminUserId: string | null;
  first: { campaign: string | null; content: string | null; landingPath: string; medium: string; referrerHost: string | null; source: string };
  last: { campaign: string | null; content: string | null; landingPath: string; medium: string; referrerHost: string | null; source: string };
  visitorAttributionId: string;
};

type VisitInput = { isEntry?: boolean; path: string; referrer?: string | null; ref?: string | null; utmCampaign?: string | null; utmContent?: string | null; utmMedium?: string | null; utmSource?: string | null };

function secret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "les-jumelles-attribution";
}

function hashVisitor(value: string) {
  return createHash("sha256").update(`${secret()}:${value}`).digest("hex");
}

function clean(value: string | null | undefined, max = 160) {
  const result = value?.trim().slice(0, max);
  return result || null;
}

function referrerHost(value?: string | null) {
  try { return value ? new URL(value).hostname.toLowerCase().replace(/^www\./, "").slice(0, 120) : null; } catch { return null; }
}

export function classifyChannel(input: VisitInput, link?: LinkRow | null) {
  const host = referrerHost(input.referrer);
  const source = clean(link?.utm_source || input.utmSource)?.toLowerCase();
  const medium = clean(link?.utm_medium || input.utmMedium)?.toLowerCase();
  if (link) return { source: source || "agent", medium: medium || "referral", channel: "Apporteur", host };
  if (source || medium) {
    const paid = /cpc|ppc|paid|display/.test(medium || "");
    const social = /social/.test(medium || "") || /facebook|instagram|linkedin|tiktok/.test(source || "");
    return { source: source || "campagne", medium: medium || "campaign", channel: paid ? "Paid" : social ? "Social" : "Campagne", host };
  }
  if (host && /google\.|bing\.|ecosia\.|duckduckgo\.|yahoo\./.test(host)) return { source: host.split(".")[0], medium: "organic", channel: "Organic", host };
  if (host && /facebook|instagram|linkedin|tiktok|pinterest|youtube/.test(host)) return { source: host, medium: "social", channel: "Social", host };
  if (host && !/jumellesimmo\.fr|immo-rho\.vercel\.app/.test(host)) return { source: host, medium: "referral", channel: "Referral", host };
  return { source: "direct", medium: "none", channel: "Direct", host: null };
}

export async function recordAttributionVisit(rawVisitorId: string, input: VisitInput) {
  const path = input.path.startsWith("/") ? input.path.slice(0, 300) : "/";
  const visitorHash = hashVisitor(rawVisitorId);
  const refCode = clean(input.ref, 40)?.toLowerCase();
  const links = refCode ? await adminRest<LinkRow[]>(`attribution_links?code=eq.${encodeURIComponent(refCode)}&is_active=eq.true&select=id,code,admin_user_id,utm_source,utm_medium,utm_campaign,utm_content&limit=1`) : [];
  const link = links[0] ?? null;
  const classified = classifyChannel(input, link);
  const campaign = clean(link?.utm_campaign || input.utmCampaign);
  const content = clean(link?.utm_content || input.utmContent);
  const existing = await adminRest<AttributionRow[]>(`visitor_attributions?visitor_hash=eq.${visitorHash}&select=*&limit=1`);
  const isMeaningfulEntry = input.isEntry !== false && Boolean(link || input.utmSource || input.utmMedium || classified.host);
  let row = existing[0];

  if (!row) {
    const created = await adminRest<AttributionRow[]>("visitor_attributions?select=*", {
      method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({
        visitor_hash: visitorHash,
        first_source: classified.source, first_medium: classified.medium, first_campaign: campaign, first_content: content,
        first_referrer_host: classified.host, first_landing_path: path, first_admin_user_id: link?.admin_user_id ?? null, first_link_id: link?.id ?? null,
        last_source: classified.source, last_medium: classified.medium, last_campaign: campaign, last_content: content,
        last_referrer_host: classified.host, last_landing_path: path, last_admin_user_id: link?.admin_user_id ?? null, last_link_id: link?.id ?? null,
        last_path: path,
      }),
    });
    row = created[0];
  } else {
    await adminRest(`visitor_attributions?id=eq.${row.id}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({
      last_seen_at: new Date().toISOString(), last_path: path, touch_count: (row.touch_count || 1) + 1,
      ...(isMeaningfulEntry ? { last_source: classified.source, last_medium: classified.medium, last_campaign: campaign, last_content: content, last_referrer_host: classified.host, last_landing_path: path, last_admin_user_id: link?.admin_user_id ?? null, last_link_id: link?.id ?? null } : {}),
    }, (_key, value) => value === undefined ? undefined : value) });
  }
  if (!row) throw new Error("Attribution creation failed");

  const touchSource = isMeaningfulEntry || !existing[0] ? classified.source : row.last_source;
  const touchMedium = isMeaningfulEntry || !existing[0] ? classified.medium : row.last_medium;
  const touchCampaign = isMeaningfulEntry || !existing[0] ? campaign : row.last_campaign;
  const touchContent = isMeaningfulEntry || !existing[0] ? content : row.last_content;
  const touchAdminUserId = isMeaningfulEntry || !existing[0] ? link?.admin_user_id ?? null : row.last_admin_user_id;
  await adminRest("attribution_touches", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ visitor_attribution_id: row.id, path, source: touchSource, medium: touchMedium, campaign: touchCampaign, content: touchContent, referrer_host: isMeaningfulEntry ? classified.host : row.last_referrer_host, admin_user_id: touchAdminUserId, attribution_link_id: isMeaningfulEntry ? link?.id ?? null : null, is_entry: !existing[0] || isMeaningfulEntry }) });
  return { attributionId: row.id, channel: isMeaningfulEntry || !existing[0] ? classified.channel : row.last_medium };
}

export async function getCurrentAttribution(): Promise<AttributionSnapshot | null> {
  const visitorId = (await cookies()).get(attributionCookieName)?.value;
  if (!visitorId || !/^[0-9a-f-]{36}$/i.test(visitorId)) return null;
  const rows = await adminRest<AttributionRow[]>(`visitor_attributions?visitor_hash=eq.${hashVisitor(visitorId)}&select=*&limit=1`);
  const row = rows[0];
  if (!row) return null;
  return {
    visitorAttributionId: row.id,
    attributedAdminUserId: row.first_admin_user_id || row.last_admin_user_id,
    first: { source: row.first_source, medium: row.first_medium, campaign: row.first_campaign, content: row.first_content, referrerHost: row.first_referrer_host, landingPath: row.first_landing_path },
    last: { source: row.last_source, medium: row.last_medium, campaign: row.last_campaign, content: row.last_content, referrerHost: row.last_referrer_host, landingPath: row.last_landing_path },
  };
}

export async function ensureAttributionCookie() {
  const store = await cookies();
  const current = store.get(attributionCookieName)?.value;
  const value = current && /^[0-9a-f-]{36}$/i.test(current) ? current : crypto.randomUUID();
  if (!current) store.set(attributionCookieName, value, { httpOnly: true, maxAge: cookieLifetime, path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  return value;
}

export function attributionColumns(snapshot: AttributionSnapshot | null) {
  return snapshot ? { attribution_visitor_id: snapshot.visitorAttributionId, attributed_admin_user_id: snapshot.attributedAdminUserId, attribution_snapshot: snapshot } : {};
}

export async function recordAttributedConversion(snapshot: AttributionSnapshot | null, kind: "estimation" | "buyer_search" | "contact", conversionId: string | null, path: string) {
  if (!snapshot) return;
  const dedupeKey = createHash("sha256").update(`${secret()}:conversion:${kind}:${conversionId || snapshot.visitorAttributionId}`).digest("hex");
  await adminRest("site_analytics_events?on_conflict=dedupe_key", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify({ event_type: "conversion", audience_type: "human", path, visitor_attribution_id: snapshot.visitorAttributionId, channel: snapshot.last.medium, campaign: snapshot.last.campaign, attributed_admin_user_id: snapshot.attributedAdminUserId, conversion_kind: kind, conversion_id: conversionId, device_type: "desktop", dedupe_key: dedupeKey }) });
}
