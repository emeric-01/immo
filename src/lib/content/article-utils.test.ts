import { describe, expect, it } from "vitest";
import { createArticleSlug, estimateReadingMinutes, normalizeArticleExcerpt } from "./article-utils";

describe("content article utilities", () => {
  it("creates SEO-friendly French slugs", () => {
    expect(createArticleSlug("Prix m² à La Cadière-d’Azur !")).toBe("prix-m2-a-la-cadiere-d-azur");
  });

  it("keeps reading time above one minute", () => {
    expect(estimateReadingMinutes("Un texte court.")).toBe(1);
  });

  it("falls back to markdown when excerpt is empty", () => {
    expect(normalizeArticleExcerpt("", "## Vendre mieux\nUn vrai conseil immobilier.")).toBe("Vendre mieux Un vrai conseil immobilier.");
  });
});
