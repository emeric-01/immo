import { afterEach, describe, expect, it, vi } from "vitest";
import { getPricePageLastModified, latestLastModified } from "./last-modified";
import { getSitemapSectionEntries } from "./sitemap-data";

describe("last modified dates", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps the most recent valid content date", () => {
    expect(latestLastModified(
      "2026-08-16T17:59:40.873Z",
      "2026-08-23T18:41:15.000Z",
      "invalid",
    )).toBe("2026-08-23T18:41:15.000Z");
  });

  it("includes the scoped price-page template date", () => {
    vi.stubEnv("SEO_PRICE_PAGE_TEMPLATE_LAST_MODIFIED", "2026-08-23T18:41:15.000Z");

    expect(getPricePageLastModified("2026-08-20T08:00:00.000Z"))
      .toBe("2026-08-23T18:41:15.000Z");
  });
});

describe("price sitemap scope", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("only publishes Bouches-du-Rhone and Var city price pages", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    const entries = await getSitemapSectionEntries("prix-m2");
    const urls = entries.map((entry) => entry.url);

    expect(entries).toHaveLength(43);
    expect(urls).toContain("https://jumellesimmo.fr/prix-m2/aubagne");
    expect(urls).toContain("https://jumellesimmo.fr/prix-m2/hyeres");
    expect(urls).not.toContain("https://jumellesimmo.fr/prix-m2/nice");
    expect(urls).not.toContain("https://jumellesimmo.fr/prix-m2/montpellier");
  });

  it("updates a city price lastmod when the shared page content changes", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("SEO_PRICE_PAGE_TEMPLATE_LAST_MODIFIED", "2026-08-23T18:41:15.000Z");

    const entries = await getSitemapSectionEntries("prix-m2");
    const aubagne = entries.find((entry) => entry.url.endsWith("/prix-m2/aubagne"));

    expect(aubagne?.lastModified).toBe("2026-08-23T18:41:15.000Z");
  });
});
