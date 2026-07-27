import type { AttributionSnapshot } from "@/lib/attribution";

type Snapshot = AttributionSnapshot | Record<string, never> | null | undefined;

export function formatAdminAttribution(snapshot: Snapshot) {
  if (!snapshot || !("first" in snapshot)) return "Non attribuée";
  const campaign = snapshot.first.campaign ? ` · ${snapshot.first.campaign}` : "";
  return `${snapshot.first.source} / ${snapshot.first.medium}${campaign}`;
}

export function formatAdminAttributionCampaign(snapshot: Snapshot) {
  if (!snapshot || !("first" in snapshot)) return "Aucune campagne";
  return snapshot.first.campaign || "Aucune campagne";
}
