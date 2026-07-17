import { NextResponse } from "next/server";
import { validateCitySearchMiss } from "@/lib/city-search-misses";

type SupabaseConfig = {
  serviceRoleKey: string;
  url: string;
};

function getConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  return url && serviceRoleKey
    ? { serviceRoleKey, url: url.replace(/\/$/, "") }
    : null;
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Requete invalide." }, { status: 400 });
  }

  const query = typeof payload === "object" && payload !== null && "query" in payload ? payload.query : null;
  const validated = validateCitySearchMiss(query);

  if (!validated) {
    return NextResponse.json({ error: "Recherche invalide." }, { status: 400 });
  }

  const config = getConfig();
  if (!config) {
    return NextResponse.json({ error: "Configuration indisponible." }, { status: 503 });
  }

  const response = await fetch(`${config.url}/rest/v1/city_search_misses`, {
    body: JSON.stringify({
      query_display: validated.display,
      query_normalized: validated.normalized,
      source: "city_directory",
    }),
    cache: "no-store",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    method: "POST",
  });

  if (!response.ok) {
    console.error("City search miss insert failed", response.status);
    return NextResponse.json({ error: "Enregistrement indisponible." }, { status: 502 });
  }

  return NextResponse.json({ recorded: true }, { status: 201 });
}
