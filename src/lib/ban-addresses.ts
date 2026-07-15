import "server-only";

import { MIN_ADDRESS_QUERY_LENGTH, type AddressSuggestion } from "@/lib/immo-data";

const BAN_GEOCODING_URL = "https://data.geopf.fr/geocodage/search";
const MIN_BAN_SCORE = 0.3;

type BanFeature = {
  geometry?: {
    coordinates?: number[];
    type?: string;
  };
  properties?: {
    banId?: string;
    city?: string;
    citycode?: string;
    depcode?: string;
    id?: string;
    label?: string;
    postcode?: string;
    score?: number;
    type?: string;
  };
  type?: string;
};

type BanFeatureCollection = {
  features?: BanFeature[];
  type?: string;
};

export async function searchBanAddresses(query: string): Promise<AddressSuggestion[]> {
  const normalizedQuery = query.trim();

  if (normalizedQuery.length < MIN_ADDRESS_QUERY_LENGTH) {
    return [];
  }

  const params = new URLSearchParams({
    limit: "5",
    q: normalizedQuery,
  });
  const response = await fetch(`${BAN_GEOCODING_URL}?${params}`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw new Error(`BAN geocoding failed (${response.status}): ${await response.text()}`);
  }

  return mapBanResponse((await response.json()) as BanFeatureCollection);
}

export function mapBanResponse(payload: BanFeatureCollection): AddressSuggestion[] {
  return (payload.features ?? [])
    .map((feature): AddressSuggestion | null => {
      const properties = feature.properties;
      const coordinates = feature.geometry?.coordinates;

      if (
        !properties?.label ||
        !coordinates ||
        coordinates.length !== 2 ||
        !Number.isFinite(coordinates[0]) ||
        !Number.isFinite(coordinates[1]) ||
        (properties.score ?? 0) < MIN_BAN_SCORE ||
        !["housenumber", "street", "locality"].includes(properties.type ?? "")
      ) {
        return null;
      }

      return {
        addressId: properties.banId ?? properties.id,
        cityName: properties.city,
        departmentCode: properties.depcode,
        inseeCode: properties.citycode,
        label: properties.label,
        latitude: coordinates[1],
        longitude: coordinates[0],
        postCode: properties.postcode ? [properties.postcode] : undefined,
      };
    })
    .filter((suggestion): suggestion is AddressSuggestion => Boolean(suggestion));
}
