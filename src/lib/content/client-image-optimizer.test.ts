import { describe, expect, it } from "vitest";
import { createSeoImageBaseName } from "./client-image-optimizer";

describe("createSeoImageBaseName", () => {
  it("keeps a useful SEO filename while normalizing it for storage", () => {
    expect(createSeoImageBaseName("Prix m² La Ciotat – Vue Mer.JPG"))
      .toBe("prix-m2-la-ciotat-vue-mer");
  });

  it("removes path fragments and unsafe characters", () => {
    expect(createSeoImageBaseName("photos/Été 2026/Salon & terrasse.png"))
      .toBe("salon-terrasse");
  });

  it("provides a safe fallback", () => {
    expect(createSeoImageBaseName("---.jpg")).toBe("image-article");
  });
});
