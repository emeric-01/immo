import { describe, expect, it } from "vitest";
import { isPublicSitemapPath, mergePublicSitemapEntries } from "./sitemap";

describe("public sitemap", () => {
  it("excludes private and non-indexable routes", () => {
    expect(isPublicSitemapPath("/admin/parrainages")).toBe(false);
    expect(isPublicSitemapPath("/client/recherches/123")).toBe(false);
    expect(isPublicSitemapPath("/api/referrals")).toBe(false);
    expect(isPublicSitemapPath("/recherche/confirmation")).toBe(false);
    expect(isPublicSitemapPath("/recherche-acheteurs")).toBe(false);
    expect(isPublicSitemapPath("/contenus/prix-m2-aubagne")).toBe(true);
  });

  it("deduplicates URLs and removes query strings and fragments", () => {
    const entries = mergePublicSitemapEntries(
      [{ url: "https://example.com/contenus/article?preview=1#intro", priority: 0.7 }],
      [
        { url: "https://example.com/contenus/article", priority: 0.4 },
        { url: "https://example.com/admin/biens" },
      ],
    );

    expect(entries).toEqual([
      { url: "https://example.com/contenus/article", priority: 0.7 },
    ]);
  });
});
