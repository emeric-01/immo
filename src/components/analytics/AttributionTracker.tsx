"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export function AttributionTracker() {
  const pathname = usePathname();
  const search = useSearchParams();
  const hasTracked = useRef(false);
  useEffect(() => {
    const payload = {
      isEntry: hasTracked.current ? "false" : "true",
      path: `${pathname}${search.size ? `?${search.toString()}` : ""}`,
      referrer: document.referrer || null,
      ref: search.get("ref"),
      utmSource: search.get("utm_source"), utmMedium: search.get("utm_medium"),
      utmCampaign: search.get("utm_campaign"), utmContent: search.get("utm_content"),
    };
    hasTracked.current = true;
    void fetch("/api/attribution", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), keepalive: true });
  }, [pathname, search]);
  return null;
}
