import "server-only";

export type InseeDistributionItem = { label: string; value: number };
export type InseeHousingProfile = {
  cityName: string;
  inseeCode: string;
  vintage: number;
  sourceUrl: string;
  totalHousing: number;
  housingTypes: InseeDistributionItem[];
  occupancy: InseeDistributionItem[];
  tenure: InseeDistributionItem[];
  rooms: InseeDistributionItem[];
  surfaces: InseeDistributionItem[];
  construction: InseeDistributionItem[];
  moveIn: InseeDistributionItem[];
};

export async function getInseeHousingProfile(inseeCode?: string | null): Promise<InseeHousingProfile | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key || !inseeCode) return null;
  const response = await fetch(`${url}/rest/v1/insee_housing_profiles?insee_code=eq.${encodeURIComponent(inseeCode)}&select=payload&limit=1`, {
    cache: "no-store",
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!response.ok) throw new Error(`Lecture INSEE impossible (${response.status})`);
  const rows = await response.json() as Array<{ payload: InseeHousingProfile }>;
  return rows[0]?.payload ?? null;
}
