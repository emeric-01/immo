export const reportBlockDefinitions = [
  { id: "valuation", label: "Synthèse et fourchette" },
  { id: "photos", label: "Photographies du bien" },
  { id: "property", label: "Caractéristiques du bien" },
  { id: "location", label: "Adresse et localisation" },
  { id: "agent_analysis", label: "Analyse personnelle de l’agent" },
  { id: "strengths", label: "Points forts et points de vigilance" },
  { id: "price_history", label: "Évolution du prix au m²" },
  { id: "market", label: "Données du marché" },
  { id: "comparables", label: "Ventes comparables" },
  { id: "insee", label: "Graphiques INSEE" },
  { id: "strategy", label: "Stratégie de commercialisation" },
  { id: "methodology", label: "Méthodologie" },
  { id: "agency", label: "Présentation des Jumelles Immo" },
] as const;

export type EstimationReportBlockId = typeof reportBlockDefinitions[number]["id"];
export type EstimationReportBlock = { enabled: boolean; id: EstimationReportBlockId };

export function normalizeReportBlocks(blocks: unknown): EstimationReportBlock[] {
  const allowed = new Set<EstimationReportBlockId>(reportBlockDefinitions.map(({ id }) => id));
  const seen = new Set<EstimationReportBlockId>();
  const normalized: EstimationReportBlock[] = [];

  if (Array.isArray(blocks)) {
    for (const block of blocks) {
      if (!block || typeof block !== "object") continue;
      const candidate = block as { enabled?: unknown; id?: unknown };
      if (typeof candidate.id !== "string" || typeof candidate.enabled !== "boolean") continue;
      if (!allowed.has(candidate.id as EstimationReportBlockId) || seen.has(candidate.id as EstimationReportBlockId)) continue;
      const id = candidate.id as EstimationReportBlockId;
      seen.add(id);
      normalized.push({ enabled: candidate.enabled, id });
    }
  }

  for (const { id } of reportBlockDefinitions) {
    if (!seen.has(id)) normalized.push({ enabled: true, id });
  }

  return normalized;
}
