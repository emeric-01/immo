// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { getCityBySlug } from "./cities";
import {
  readCityMarketCache,
  readCityMarketCaches,
  readCityMarketCacheSummaries,
  readCityMarketTrends,
} from "./city-market-cache";
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

  it("bypasses the former Immo Data cache key for a city page", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-test");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([
      {
        fetched_at: "2026-08-23T23:09:58.000Z",
        insee_code: "13005",
        market_data: { ...market, source: "dvf" },
      },
    ]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await readCityMarketCache(city("aubagne"));

    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("order=fetched_at.desc");
  });

  it("keeps complete published snapshots in batch reads", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-test");
    const detailedMarket = {
      ...market,
      historySource: "immo-data-dvf" as const,
      historyCoverage: {
        expectedFrom: "2014",
        expectedTo: "2025",
        granularity: "annual" as const,
        missingApartmentPeriods: [],
        missingHousePeriods: [],
        status: "complete" as const,
      },
      history: [
        {
          apartment: 3_000,
          apartmentSource: "immo-data" as const,
          house: 4_000,
          houseSource: "immo-data" as const,
          period: "2014",
        },
      ],
    } satisfies CityMarketData;
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([
      {
        fetched_at: "2026-08-10T12:00:00.000Z",
        insee_code: "13001",
        market_data: detailedMarket,
      },
    ]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const snapshots = await readCityMarketCaches([city("aix-en-provence"), city("aubagne")]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("insee_code=in.%28%2213001%22%2C%2213005%22%29");
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("select=insee_code%2Cmarket_data%2Cfetched_at");
    expect(snapshots.get("13001")?.data.apartment.averagePricePerM2).toBe(5_300);
    expect(snapshots.get("13001")?.data.history).toEqual(detailedMarket.history);
    expect(snapshots.get("13001")?.data.historyCoverage?.status).toBe("complete");
    expect(snapshots.has("13005")).toBe(false);
  });

  it("reads lightweight summaries without presenting them as complete snapshots", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-test");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([
      {
        apartment: market.apartment,
        fetched_at: "2026-08-10T12:00:00.000Z",
        house: market.house,
        insee_code: "13001",
        source: market.source,
        transaction_count: 42,
        updated_at: market.updatedAt,
      },
    ]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const summaries = await readCityMarketCacheSummaries([city("aix-en-provence")]);

    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("source%3Amarket_data-%3E%3Esource");
    expect(summaries.get("13001")?.data.apartment.averagePricePerM2).toBe(5_300);
    expect(summaries.get("13001")?.data.transactionCount).toBe(42);
    expect(summaries.get("13001")?.data).not.toHaveProperty("history");
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

  it("does not turn an unavailable trend into a published zero", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-test");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([
      {
        fetched_at: "2026-08-24T13:40:40.000Z",
        insee_code: "13013",
        market_data: {
          ...market,
          source: "dvf",
          apartment: { ...market.apartment, trend1Year: 0, trendSource: "unavailable" },
          house: { ...market.house, trend1Year: 4.7, trendSource: "history" },
        },
      },
      {
        fetched_at: "2026-08-24T13:40:40.000Z",
        insee_code: "83053",
        market_data: {
          ...market,
          source: "dvf",
          apartment: { ...market.apartment, trend1Year: 0, trendSource: "unavailable" },
          house: { ...market.house, trend1Year: 0, trendSource: "unavailable" },
        },
      },
    ]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const trends = await readCityMarketTrends([city("belcodene"), city("evenos")]);

    expect(trends.get("13013")).toBe(4.7);
    expect(trends.has("83053")).toBe(false);
  });
});
