import { describe, expect, it } from "vitest";
import { serializeSitemap, serializeSitemapIndex } from "./sitemap-xml";

describe("sitemap XML", () => {
  it("serializes canonical URLs, dates and images", () => {
    const xml = serializeSitemap([{
      images: ["https://example.com/image?a=1&b=2"],
      lastModified: "2026-07-23T08:00:00.000Z",
      url: "https://example.com/prix-m2/aubagne?a=1&b=2",
    }]);

    expect(xml).toContain("<?xml-stylesheet");
    expect(xml).toContain("https://example.com/prix-m2/aubagne?a=1&amp;b=2");
    expect(xml).toContain("<lastmod>2026-07-23T08:00:00.000Z</lastmod>");
    expect(xml).toContain("<image:loc>https://example.com/image?a=1&amp;b=2</image:loc>");
  });

  it("serializes a sitemap index", () => {
    const xml = serializeSitemapIndex([
      { url: "https://example.com/sitemaps/pages.xml" },
      { url: "https://example.com/sitemaps/biens.xml" },
    ]);

    expect(xml).toContain("<sitemapindex");
    expect(xml.match(/<sitemap>/g)).toHaveLength(2);
  });
});
