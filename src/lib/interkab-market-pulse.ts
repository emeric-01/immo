import "server-only";
import {
  getAllStoredInterkabListings,
  getInterkabCities,
  getLiveInterkabCityListings,
  INTERKAB_CITIES,
} from "@/lib/interkab";
import { buildMarketNowcast, type MarketNowcast } from "@/lib/market-nowcast";

export type InterkabMarketPulse = {
  apartment: MarketNowcast | null;
  house: MarketNowcast | null;
  updatedAt: string | null;
};

export async function getInterkabMarketPulse(
  inseeCode: string,
  apartmentDvfMedian: number,
  houseDvfMedian: number,
  options: { allowLiveFallback?: boolean } = {},
): Promise<InterkabMarketPulse | null> {
  try {
    const listings = await getAllStoredInterkabListings({ inseeCode });
    const cityState = await getInterkabCities()
      .then((cities) => cities.find((city) => city.insee_code === inseeCode) ?? null)
      .catch(() => null);

    return {
      apartment: buildMarketNowcast(listings, "apartment", apartmentDvfMedian),
      house: buildMarketNowcast(listings, "house", houseDvfMedian),
      updatedAt: cityState?.last_synced_at ?? null,
    };
  } catch {
    if (options.allowLiveFallback === false) return null;

    const city = INTERKAB_CITIES.find((candidate) => candidate.inseeCode === inseeCode);
    if (!city) return null;
    try {
      const live = await getLiveInterkabCityListings(city);
      return {
        apartment: buildMarketNowcast(live.listings, "apartment", apartmentDvfMedian),
        house: buildMarketNowcast(live.listings, "house", houseDvfMedian),
        updatedAt: live.fetchedAt,
      };
    } catch {
      return null;
    }
  }
}
