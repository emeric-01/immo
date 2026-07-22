import { describe, expect, it } from "vitest";
import { comparePublicProperties, type PublicPropertySort } from "@/lib/property-order";

const property = (overrides: Partial<{
  created_at: string;
  display_order: number;
  price: number;
  published_at: string | null;
  status: string;
}> = {}) => ({
  created_at: "2026-07-01T10:00:00.000Z",
  display_order: 0,
  price: 300_000,
  published_at: null,
  status: "published",
  ...overrides,
});

describe("public property ordering", () => {
  it("uses the agency order by default", () => {
    const rows = [property({ display_order: 2 }), property({ display_order: 0 }), property({ display_order: 1 })];
    expect(rows.sort(comparePublicProperties("manual")).map((row) => row.display_order)).toEqual([0, 1, 2]);
  });

  it.each<PublicPropertySort>(["manual", "recent", "price-asc", "price-desc"])("keeps sold properties last with %s sorting", (sort) => {
    const rows = [property({ status: "sold", price: 1 }), property({ status: "published", price: 999_999 })];
    expect(rows.sort(comparePublicProperties(sort)).map((row) => row.status)).toEqual(["published", "sold"]);
  });

  it("sorts by publication date when requested", () => {
    const rows = [property({ published_at: "2026-06-01" }), property({ published_at: "2026-07-01" })];
    expect(rows.sort(comparePublicProperties("recent"))[0].published_at).toBe("2026-07-01");
  });

  it("sorts prices only inside the same availability group", () => {
    const rows = [property({ price: 400_000 }), property({ price: 250_000 }), property({ price: 100_000, status: "sold" })];
    expect(rows.sort(comparePublicProperties("price-asc")).map((row) => row.price)).toEqual([250_000, 400_000, 100_000]);
  });
});
