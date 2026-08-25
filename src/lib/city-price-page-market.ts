import "server-only";

import type { City } from "./cities";
import { getCityMarketDataSet } from "./city-market-data";
import { resolvePublishedCityMarket } from "./published-city-market";

export async function loadCityPricePageMarket(
  city: City,
  nearbyCities: City[],
  usePublishedMarket: boolean,
) {
  const marketSnapshots = await getCityMarketDataSet([city, ...nearbyCities]);
  const publishedMarket = usePublishedMarket
    ? await resolvePublishedCityMarket(
      city,
      marketSnapshots.get(city.inseeCode) ?? null,
    )
    : null;

  return {
    market: publishedMarket?.base ?? marketSnapshots.get(city.inseeCode) ?? null,
    marketSnapshots,
    publishedMarket,
  };
}
