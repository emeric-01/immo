import { NextResponse } from "next/server";
import {
  MIN_ADDRESS_QUERY_LENGTH,
  searchImmoDataAddresses,
} from "@/lib/immo-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < MIN_ADDRESS_QUERY_LENGTH) {
    return NextResponse.json([]);
  }

  try {
    const suggestions = await searchImmoDataAddresses(query);

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "La recherche d'adresse est temporairement indisponible. Continuez avec une saisie manuelle.",
      },
      { status: 502 },
    );
  }
}
