import { describe, expect, it } from "vitest";
import { getContentCategory, getContentCategoryLabel, normalizeContentCategory } from "./categories";

describe("content categories", () => {
  it.each([
    ["Achat local", "acheter"],
    ["vente", "vendre"],
    ["Valorisation", "vendre"],
    ["Estimation", "estimer"],
    ["Marché local", "marche-immobilier-local"],
    ["prix-m2", "marche-immobilier-local"],
    ["Urbanisme", "conseils-immobiliers"],
  ])("normalizes legacy category %s", (legacyCategory, category) => {
    expect(normalizeContentCategory(legacyCategory)).toBe(category);
  });

  it("provides the public label", () => {
    expect(getContentCategoryLabel("marche-immobilier-local")).toBe("Marché immobilier local");
  });

  it("provides explicit buyer and seller folder labels", () => {
    expect(getContentCategory("acheter")?.folderLabel).toBe("Dossier acquéreur");
    expect(getContentCategory("vendre")?.folderLabel).toBe("Dossier vendeur");
  });
});
