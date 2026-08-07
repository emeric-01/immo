import { describe, expect, it } from "vitest";
import { normalizeReportBlocks, reportBlockDefinitions } from "./estimation-report-config";

describe("normalizeReportBlocks", () => {
  it("complète les anciens dossiers avec les nouvelles rubriques", () => {
    const legacyBlocks = reportBlockDefinitions
      .filter(({ id }) => !["photos", "location", "price_history"].includes(id))
      .map(({ id }) => ({ enabled: true, id }));

    const normalized = normalizeReportBlocks(legacyBlocks);

    expect(normalized).toHaveLength(reportBlockDefinitions.length);
    expect(normalized.slice(0, legacyBlocks.length)).toEqual(legacyBlocks);
    expect(normalized.slice(-3)).toEqual([
      { enabled: true, id: "photos" },
      { enabled: true, id: "location" },
      { enabled: true, id: "price_history" },
    ]);
  });

  it("ignore les doublons et les blocs inconnus", () => {
    const normalized = normalizeReportBlocks([
      { enabled: false, id: "valuation" },
      { enabled: true, id: "valuation" },
      { enabled: true, id: "inconnu" },
    ]);

    expect(normalized).toHaveLength(reportBlockDefinitions.length);
    expect(normalized[0]).toEqual({ enabled: false, id: "valuation" });
    expect(new Set(normalized.map(({ id }) => id)).size).toBe(reportBlockDefinitions.length);
  });
});
