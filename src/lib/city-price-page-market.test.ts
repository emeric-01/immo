// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { City } from "./cities";
import type { CityMarketData } from "./city-market-data";

vi.mock("server-only", () => ({}));
vi.mock("./city-market-data", () => ({ getCityMarketDataSet: vi.fn() }));
vi.mock("./published-city-market", () => ({ resolvePublishedCityMarket: vi.fn() }));

import { getCityMarketDataSet } from "./city-market-data";
import { loadCityPricePageMarket } from "./city-price-page-market";
import { resolvePublishedCityMarket } from "./published-city-market";

const allauch = { inseeCode: "13002", slug: "allauch" } as City;
const planDeCuques = { inseeCode: "13075", slug: "plan-de-cuques" } as City;
const marseille = { inseeCode: "13055", slug: "marseille" } as City;
const allauchMarket = { source: "dvf" } as CityMarketData;
const planDeCuquesMarket = { source: "dvf" } as CityMarketData;
const marseilleMarket = { source: "dvf" } as CityMarketData;

describe("city price page market loading", () => {
  beforeEach(() => {
    vi.mocked(getCityMarketDataSet).mockReset();
    vi.mocked(resolvePublishedCityMarket).mockReset();
  });

  it("keeps neighboring snapshots when the current city uses the published model", async () => {
    const snapshots = new Map([
      [allauch.inseeCode, allauchMarket],
      [planDeCuques.inseeCode, planDeCuquesMarket],
      [marseille.inseeCode, marseilleMarket],
    ]);
    vi.mocked(getCityMarketDataSet).mockResolvedValue(snapshots);
    vi.mocked(resolvePublishedCityMarket).mockResolvedValue({
      base: allauchMarket,
      current: allauchMarket,
      pulse: null,
    });

    const result = await loadCityPricePageMarket(
      allauch,
      [planDeCuques, marseille],
      true,
    );

    expect(getCityMarketDataSet).toHaveBeenCalledWith([
      allauch,
      planDeCuques,
      marseille,
    ]);
    expect(resolvePublishedCityMarket).toHaveBeenCalledWith(allauch, allauchMarket);
    expect(result.marketSnapshots.get(planDeCuques.inseeCode)).toBe(planDeCuquesMarket);
    expect(result.marketSnapshots.get(marseille.inseeCode)).toBe(marseilleMarket);
  });
});
