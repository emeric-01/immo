import "server-only";

import { unstable_cache } from "next/cache";
import { searchBanAddresses } from "@/lib/ban-addresses";

async function geocode(address: string, postalCode: string, city: string) {
  if (!address.trim() || !city.trim()) return null;
  try {
    const [result] = await searchBanAddresses([address, postalCode, city].filter(Boolean).join(" "));
    return result ? { latitude: result.latitude, longitude: result.longitude } : null;
  } catch {
    return null;
  }
}

export const geocodePropertyAddress = unstable_cache(geocode, ["property-address-geocoding-v1"], { revalidate: 60 * 60 * 24 * 90 });
