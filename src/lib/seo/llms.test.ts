import { describe, expect, it } from "vitest";
import { buildLlmsText } from "./llms";

describe("llms text", () => {
  it("lists public content without exposing noindex properties", () => {
    const content = buildLlmsText({
      articles: [{ excerpt: "Analyse locale", slug: "marche-aubagne", title: "Marche a Aubagne" }],
      properties: [
        {
          city_name: "Aubagne",
          seo_noindex: false,
          slug: "maison-aubagne",
          status: "published",
          title: "Maison a Aubagne",
        },
        {
          city_name: "Gemenos",
          seo_noindex: true,
          slug: "bien-prive",
          status: "published",
          title: "Bien prive",
        },
      ],
    });

    expect(content).toContain("/contenus/marche-aubagne");
    expect(content).toContain("/biens/maison-aubagne");
    expect(content).not.toContain("bien-prive");
    expect(content).not.toContain("/admin");
    expect(content).not.toContain("/client");
  });
});
