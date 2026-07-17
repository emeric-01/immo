import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { southCities } from "@/lib/cities";
import { refreshCityMarketData } from "@/lib/city-market-data";

export const maxDuration = 300;

export async function POST(request: Request) {
  const session = await getAdminSession();
  const bearerToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const adminToken = process.env.ADMIN_ACCESS_TOKEN?.trim();

  if (!session && (!adminToken || bearerToken !== adminToken)) {
    return NextResponse.json({ message: "Accès refusé." }, { status: 401 });
  }

  const requestedSlug = new URL(request.url).searchParams.get("city");
  const cities = southCities.filter(
    (city) =>
      (city.department === "Bouches-du-Rhone" || city.department === "Var") &&
      (!requestedSlug || city.slug === requestedSlug),
  );
  const results: Array<{ city: string; status: "stored" | "error"; message?: string }> = [];

  // Limit concurrency to avoid bursts against Immo Data while keeping the one-off
  // initialization within the serverless execution window.
  for (let index = 0; index < cities.length; index += 2) {
    const batch = cities.slice(index, index + 2);
    const batchResults = await Promise.all(
      batch.map(async (city) => {
        try {
          await refreshCityMarketData(city);
          return { city: city.slug, status: "stored" as const };
        } catch (error) {
          return {
            city: city.slug,
            message: error instanceof Error ? error.message : "Erreur inconnue",
            status: "error" as const,
          };
        }
      }),
    );
    results.push(...batchResults);
  }

  return NextResponse.json({
    errors: results.filter((result) => result.status === "error").length,
    stored: results.filter((result) => result.status === "stored").length,
    results,
  });
}
