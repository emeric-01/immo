import "server-only";

import { createHmac } from "crypto";
import { clientSupabaseRequest } from "@/lib/client-access/supabase";
import { sendEstimationVolumeAlertEmail } from "@/lib/email/buyer-search-emails";

type UsageCounter = {
  alert_global: boolean;
  alert_ip: boolean;
  bucket_started_at: string;
  global_count: number;
  ip_count: number;
};

export const estimationHourlyIpLimit = 5;

export function isEstimationRateLimited(counter: UsageCounter | null) {
  return Boolean(counter && counter.ip_count > estimationHourlyIpLimit);
}

export async function recordEstimationApiUsage(request: Request): Promise<UsageCounter | null> {
  try {
    const clientIp = getClientIp(request);

    if (isMonitoringExcludedIp(clientIp)) {
      return null;
    }

    const ipHash = hashClientIp(clientIp);
    const counters = await clientSupabaseRequest<UsageCounter[]>(
      "rpc/record_estimation_api_usage",
      {
        body: JSON.stringify({ p_ip_hash: ipHash }),
        method: "POST",
      },
    );
    const counter = counters[0];

    if (!counter) {
      return null;
    }

    if (counter.alert_ip || counter.alert_global) {
      await sendEstimationVolumeAlertEmail({
        globalCount: counter.global_count,
        ipCount: counter.ip_count,
        scope: counter.alert_global ? "global" : "ip",
        windowStartedAt: counter.bucket_started_at,
      });
    }

    return counter;
  } catch (error) {
    // A monitoring outage must never prevent a legitimate estimation.
    console.error("Estimation API monitoring failed", error);
    return null;
  }
}

function isMonitoringExcludedIp(ipAddress: string) {
  const excludedIps = process.env.ESTIMATION_MONITORING_EXCLUDED_IPS
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean) ?? [];

  return excludedIps.includes(ipAddress);
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function hashClientIp(ipAddress: string) {
  const secret =
    process.env.ESTIMATION_ALERT_SECRET?.trim() ||
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!secret) {
    throw new Error("A server secret is required for estimation monitoring.");
  }

  return createHmac("sha256", secret).update(ipAddress).digest("hex");
}
