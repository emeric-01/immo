import "server-only";

export type InseeDistributionItem = { label: string; value: number };
export type InseeDemographics = {
  population: number;
  population2012?: number;
  population2017?: number;
  change2017To2023Percent?: number;
  under20Share?: number;
  age25To39Share?: number;
  age65PlusShare?: number;
  medianStandardOfLiving?: number;
  povertyRate?: number;
};

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
  demographics?: InseeDemographics;
  dataVintages?: {
    census: number;
    income?: number;
    surfaces?: number;
  };
};

const INSEE_PROFILE_REVALIDATE_SECONDS = 24 * 60 * 60;

export async function getInseeHousingProfile(inseeCode?: string | null): Promise<InseeHousingProfile | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key || !inseeCode) return null;
  const response = await fetch(`${url}/rest/v1/insee_housing_profiles?insee_code=eq.${encodeURIComponent(inseeCode)}&select=payload&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    next: {
      revalidate: INSEE_PROFILE_REVALIDATE_SECONDS,
      tags: [`insee-housing-${inseeCode}`],
    },
  });
  if (!response.ok) throw new Error(`Lecture INSEE impossible (${response.status})`);
  const rows = await response.json() as Array<{ payload: InseeHousingProfile }>;
  return rows[0]?.payload ?? null;
}
