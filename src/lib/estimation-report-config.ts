export const reportBlockDefinitions = [
  { id: "valuation", label: "Synthèse et fourchette" },
  { id: "property", label: "Caractéristiques du bien" },
  { id: "agent_analysis", label: "Analyse personnelle de l’agent" },
  { id: "strengths", label: "Points forts et points de vigilance" },
  { id: "market", label: "Données du marché" },
  { id: "comparables", label: "Ventes comparables" },
  { id: "insee", label: "Graphiques INSEE" },
  { id: "strategy", label: "Stratégie de commercialisation" },
  { id: "methodology", label: "Méthodologie" },
  { id: "agency", label: "Présentation des Jumelles Immo" },
] as const;

export type EstimationReportBlockId = typeof reportBlockDefinitions[number]["id"];
export type EstimationReportBlock = { enabled: boolean; id: EstimationReportBlockId };
