// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { getCityBySlug } from "./cities";
import { readCityMarketCaches } from "./city-market-cache";
import type { CityMarketData } from "./city-market-data";

function city(slug: string) {
  const value = getCityBySlug(slug);
  if (!value) throw new Error(`Ville inconnue : ${slug}`);
  return value;
}

const market = {
  source: "immo-data",
  updatedAt: "2026-08-01",
  apartment: { averagePricePerM2: 5_300, lowPricePerM2: 4_200, highPricePerM2: 6_200, confidenceScore: 4, trend1Year: 1.2 },
  house: { averagePricePerM2: 5_700, lowPricePerM2: 4_500, highPricePerM2: 6_800, confidenceScore: 4, trend1Year: 0.8 },
  history: [],
  zones: [],
  salePoints: [],
  neighborhoods: [],
  expensiveStreets: [],
  affordableStreets: [],
} satisfies CityMarketData;

describe("city market cache", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("reads all published city snapshots in one Supabase request", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-test");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([
      {
        fetched_at: "2026-08-10T12:00:00.000Z",
        insee_code: "13001",
        market_data: market,
      },
    ]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const snapshots = await readCityMarketCaches([city("aix-en-provence"), city("aubagne")]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("insee_code=in.%28%2213001%22%2C%2213005%22%29");
    expect(snapshots.get("13001")?.data.apartment.averagePricePerM2).toBe(5_300);
    expect(snapshots.has("13005")).toBe(false);
  });

  it("returns no invented snapshot when Supabase is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const snapshots = await readCityMarketCaches([city("aubagne")]);

    expect(snapshots.size).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
