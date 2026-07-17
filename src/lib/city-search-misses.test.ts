import { describe, expect, it } from "vitest";
import {
  aggregateCitySearchMisses,
  normalizeCitySearchMissQuery,
  validateCitySearchMiss,
} from "./city-search-misses";

describe("city search misses", () => {
  it("normalizes common variants of the same city query", () => {
    expect(normalizeCitySearchMissQuery("La Cadière-d’Azur")).toBe("la cadiere d azur");
    expect(normalizeCitySearchMissQuery(" la-cadiere d azur ")).toBe("la cadiere d azur");
  });

  it("keeps short city queries and rejects likely personal or noisy values", () => {
    expect(validateCitySearchMiss("Nice")).toEqual({ display: "Nice", normalized: "nice" });
    expect(validateCitySearchMiss("a")).toBeNull();
    expect(validateCitySearchMiss("test@example.com")).toBeNull();
    expect(validateCitySearchMiss("https://example.com")).toBeNull();
  });

  it("aggregates events by normalized query and keeps the latest display spelling", () => {
    const summaries = aggregateCitySearchMisses([
      {
        city_slug: null,
        created_at: "2026-07-17T10:00:00.000Z",
        id: 1,
        is_referenced: false,
        query_display: "La Cadiere d Azur",
        query_normalized: "la cadiere d azur",
        source: "city_directory",
      },
      {
        city_slug: null,
        created_at: "2026-07-17T12:00:00.000Z",
        id: 2,
        is_referenced: false,
        query_display: "La Cadière-d’Azur",
        query_normalized: "la cadiere d azur",
        source: "city_directory",
      },
      {
        city_slug: "nice",
        created_at: "2026-07-17T11:00:00.000Z",
        id: 3,
        is_referenced: true,
        query_display: "Nice",
        query_normalized: "nice",
        source: "city_directory",
      },
    ]);

    expect(summaries[0]).toMatchObject({
      displayQuery: "La Cadière-d’Azur",
      firstSearchedAt: "2026-07-17T10:00:00.000Z",
      lastSearchedAt: "2026-07-17T12:00:00.000Z",
      searchCount: 2,
    });
    expect(summaries[1]).toMatchObject({ displayQuery: "Nice", searchCount: 1 });
    expect(summaries[1]).toMatchObject({ citySlug: "nice", isReferenced: true });
  });
});
