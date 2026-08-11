import { NextResponse } from "next/server";
import { enrichInterkabListingDetails } from "@/lib/interkab";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const results = await enrichInterkabListingDetails(20);
  return NextResponse.json({ processed: results.length, results });
}
