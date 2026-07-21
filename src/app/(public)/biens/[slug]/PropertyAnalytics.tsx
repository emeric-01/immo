"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

type EventType = "view" | "visit_request" | "phone_click" | "email_click";

function visitorId() {
  const key = "lj-property-visitor";
  let value = localStorage.getItem(key);
  if (!value) { value = crypto.randomUUID(); localStorage.setItem(key, value); }
  return value;
}

function track(propertyId: string, eventType: EventType) {
  const payload = JSON.stringify({ propertyId, eventType, visitorId: visitorId(), referrer: document.referrer });
  if (navigator.sendBeacon) navigator.sendBeacon("/api/property-analytics", new Blob([payload], { type: "application/json" }));
  else void fetch("/api/property-analytics", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true });
}

export function PropertyAnalyticsTracker({ propertyId }: { propertyId: string }) {
  useEffect(() => { track(propertyId, "view"); }, [propertyId]);
  return null;
}

export function TrackedPropertyLink({ children, className, eventType, href, propertyId }: { children: ReactNode; className?: string; eventType: Exclude<EventType, "view">; href: string; propertyId: string }) {
  const onClick = () => track(propertyId, eventType);
  return <a className={className} href={href} onClick={onClick}>{children}</a>;
}
