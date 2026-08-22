// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCityBySlug } from "./cities";

vi.mock("./city-market-cache", () => ({
  readCityMarketCache: vi.fn(),
  writeCityMarketCache: vi.fn(),
}));

import { readCityMarketCache, writeCityMarketCache } from "./city-market-cache";
import { getCityMarketData, getStaticCityMarketData } from "./city-market-data";

function city(slug: string) {
  const value = getCityBySlug(slug);
  if (!value) throw new Error(`Ville inconnue : ${slug}`);
  return value;
}

describe("published city market data", () => {
  beforeEach(() => {
    vi.mocked(readCityMarketCache).mockReset();
    vi.mocked(writeCityMarketCache).mockReset();
  });

  it("returns null instead of generating a price when no snapshot exists", async () => {
    vi.mocked(readCityMarketCache).mockResolvedValue(null);

    await expect(getCityMarketData(city("aix-en-provence"))).resolves.toBeNull();
  });

  it("keeps an old real snapshot without refreshing Immo Data during a public request", async () => {
    const aix = city("aix-en-provence");
    vi.mocked(readCityMarketCache).mockResolvedValue({
      data: { ...getStaticCityMarketData(aix), source: "immo-data" },
      fetchedAt: "2025-01-01T00:00:00.000Z",
      fresh: false,
    });

    const published = await getCityMarketData(aix);

    expect(published?.source).toBe("immo-data");
    expect(writeCityMarketCache).not.toHaveBeenCalled();
  });

  it("replaces Aubagne demographics embedded in an old Aix snapshot with INSEE data", async () => {
    const aix = city("aix-en-provence");
    const oldSnapshot = {
      ...getStaticCityMarketData(aix),
      source: "immo-data" as const,
      apartment: {
        ...getStaticCityMarketData(aix).apartment,
        averagePricePerM2: 5_300,
      },
      house: {
        ...getStaticCityMarketData(aix).house,
        averagePricePerM2: 5_756,
      },
    };
    vi.mocked(readCityMarketCache).mockResolvedValue({
      data: oldSnapshot,
      fetchedAt: "2026-08-10T12:00:00.000Z",
      fresh: true,
    });

    const published = await getCityMarketData(aix);

    expect(published?.localInfo).toMatchObject({
      areaKm2: 186.08,
      density: 804.5,
      population: 149695,
      source: "INSEE",
      vintage: 2023,
    });
    expect(published?.localInfo?.ownerShare).toBeUndefined();
  });

  it("removes generated map and history data from legacy snapshots", async () => {
    const aix = city("aix-en-provence");
    const oldSnapshot = { ...getStaticCityMarketData(aix), source: "immo-data" as const };
    vi.mocked(readCityMarketCache).mockResolvedValue({
      data: oldSnapshot,
      fetchedAt: "2026-08-10T12:00:00.000Z",
      fresh: true,
    });

    const published = await getCityMarketData(aix);

    expect(published?.history).toEqual([]);
    expect(published?.salePoints).toEqual([]);
    expect(published?.zones).toEqual([]);
    expect(published?.neighborhoods).toEqual([]);
  });
});
