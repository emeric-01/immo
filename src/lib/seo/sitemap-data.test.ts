import { afterEach, describe, expect, it, vi } from "vitest";
import { getSitemapSectionEntries } from "./sitemap-data";

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
});
