import "server-only";

import type { City } from "./cities";
import { getCityMarketData, getCityMarketSummarySet } from "./city-market-data";
import { resolvePublishedCityMarket } from "./published-city-market";

export async function loadCityPricePageMarket(
  city: City,
  nearbyCities: City[],
  usePublishedMarket: boolean,
) {
  const [marketSnapshots, publishedMarket, storedMarket] = await Promise.all([
    getCityMarketSummarySet(nearbyCities),
    usePublishedMarket ? resolvePublishedCityMarket(city) : Promise.resolve(null),
    usePublishedMarket ? Promise.resolve(null) : getCityMarketData(city),
  ]);
  const market = publishedMarket?.base ?? storedMarket;

  if (market) marketSnapshots.set(city.inseeCode, market);

  return {
    market,
    marketSnapshots,
    publishedMarket,
  };
}
