import type { City } from "./cities";

type StoredCityMarketTrend = {
  apartment?: number;
  house?: number;
  period: string;
};

// Latest annual trends already persisted by the back-office in Supabase.
// The public directory reads this local snapshot and never calls Immo Data.
const storedCityMarketTrends: Record<string, StoredCityMarketTrend> = {
  "13001": { apartment: -1.1, period: "2026-06" },
  "13005": { apartment: -0.3, house: -0.2, period: "2026-06" },
  "13007": { house: 0.5, period: "2026-06" },
  "13030": { apartment: -3.2, period: "2026-06" },
  "13042": { house: -0.2, period: "2026-06" },
  "83137": { apartment: -0.1, period: "2026-06" },
};

export function getStoredCityMarketTrend(city: City): number | null {
  const storedTrend = storedCityMarketTrends[city.inseeCode];

  if (!storedTrend) {
    return null;
  }

  const values = [storedTrend.apartment, storedTrend.house].filter(
    (value): value is number => typeof value === "number",
  );

  if (values.length === 0) {
    return null;
  }

  return Number(
    (values.reduce((total, value) => total + value, 0) / values.length).toFixed(1),
  );
}
