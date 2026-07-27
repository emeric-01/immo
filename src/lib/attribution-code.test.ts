import { describe, expect, it } from "vitest";
import { normalizeAttributionCode, suggestAttributionCode } from "./attribution-code";

describe("attribution codes", () => {
  it("suggests a short code from the first name", () => {
    expect(suggestAttributionCode("Émeric Legros")).toBe("emeric");
  });

  it("normalizes a custom readable code", () => {
    expect(normalizeAttributionCode("  Émeric Marseille  ")).toBe("emeric-marseille");
  });

  it("limits codes to the database maximum", () => {
    expect(normalizeAttributionCode("a".repeat(60))).toHaveLength(40);
  });
});
