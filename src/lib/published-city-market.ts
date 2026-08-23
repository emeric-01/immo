import "server-only";

import type { City } from "@/lib/cities";
import {
  getCityMarketData,
  getCityMarketDataSet,
  type CityMarketData,
} from "@/lib/city-market-data";
import { getCityPricePreviewSnapshot } from "@/lib/city-price-preview-data";
import {
  getInterkabMarketPulse,
  type InterkabMarketPulse,
} from "@/lib/interkab-market-pulse";

export type PublishedCityMarket = {
  base: CityMarketData;
  current: CityMarketData;
  pulse: InterkabMarketPulse | null;
};

function applyMarketPulse(
  market: CityMarketData,
  pulse: InterkabMarketPulse | null,
): CityMarketData {
  if (!pulse?.apartment?.nowcastPricePerM2 && !pulse?.house?.nowcastPricePerM2) {
    return market;
  }

  return {
    ...market,
    updatedAt: pulse.updatedAt ?? market.updatedAt,
    apartment: {
      ...market.apartment,
      averagePricePerM2:
        pulse.apartment?.nowcastPricePerM2 ?? market.apartment.averagePricePerM2,
    },
    house: {
      ...market.house,
      averagePricePerM2:
        pulse.house?.nowcastPricePerM2 ?? market.house.averagePricePerM2,
    },
  };
}

export async function resolvePublishedCityMarket(
  city: City,
  cachedMarket?: CityMarketData | null,
): Promise<PublishedCityMarket | null> {
  const localSnapshot = getCityPricePreviewSnapshot(city.slug);
  const base = localSnapshot ?? cachedMarket ?? await getCityMarketData(city);

  if (!base) return null;

  // A local snapshot marks a city whose new price-page methodology is published.
  // Current listing data is read from the stored back-office sync only: a public
  // page must stay usable even when the remote Interkab service is unavailable.
  const pulse = localSnapshot
    ? await getInterkabMarketPulse(
      city.inseeCode,
      base.apartment.averagePricePerM2,
      base.house.averagePricePerM2,
      { allowLiveFallback: false },
    )
    : null;

  return { base, current: applyMarketPulse(base, pulse), pulse };
}

export async function getPublishedCityMarketData(city: City) {
  return (await resolvePublishedCityMarket(city))?.current ?? null;
}

export async function getPublishedCityMarketDataSet(cities: City[]) {
  const cachedMarkets = await getCityMarketDataSet(cities);
  const resolved = await Promise.all(
    cities.map(async (city) => ({
      city,
      market: await resolvePublishedCityMarket(
        city,
        cachedMarkets.get(city.inseeCode) ?? null,
      ),
    })),
  );
  const markets = new Map<string, CityMarketData>();

  for (const { city, market } of resolved) {
    if (market) markets.set(city.inseeCode, market.current);
  }

  return markets;
}
