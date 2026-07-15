import "server-only";

import type { BuyerSearchMarketScore } from "@/lib/buyer-search/market-score-types";
import type { BuyerSearchFormData, PropertyType } from "@/lib/buyer-search/types";
import type { ClientSession } from "./auth";
import { clientSupabaseRequest } from "./supabase";

export type ClientBuyerSearchRow = {
  city_names: string[];
  client_account_id: string | null;
  contact_email: string;
  contact_first_name: string;
  contact_last_name: string;
  created_at: string;
  id: string;
  location_summary: string | null;
  maximum_budget: number | null;
  market_score: number | null;
  market_score_label: string | null;
  market_score_payload: BuyerSearchMarketScore | null;
  market_score_status: string | null;
  market_scored_at: string | null;
  minimum_bedrooms: number | null;
  minimum_land_area: number | null;
  minimum_living_area: number | null;
  property_types: PropertyType[];
  purchase_timeline: string | null;
  raw_payload: BuyerSearchFormData;
  status: string;
  updated_at: string;
};

export type ClientProjectResult =
  | { data: ClientBuyerSearchRow; status: "ready" }
  | { message: string; status: "missing_config" | "not_found" | "error" };

export async function getClientBuyerSearches(session: ClientSession) {
  try {
    return await clientSupabaseRequest<ClientBuyerSearchRow[]>(
      `buyer_searches?client_account_id=eq.${encodeURIComponent(session.id)}&select=*&order=created_at.desc`,
    );
  } catch (error) {
    console.error("Client searches load failed", error);
    return [];
  }
}

export async function getClientBuyerSearch(
  session: ClientSession,
  searchId: string,
): Promise<ClientProjectResult> {
  try {
    const searches = await clientSupabaseRequest<ClientBuyerSearchRow[]>(
      `buyer_searches?id=eq.${encodeURIComponent(searchId)}&client_account_id=eq.${encodeURIComponent(session.id)}&select=*&limit=1`,
    );
    const search = searches[0];

    if (!search) {
      return {
        message: "Cette recherche n'existe pas ou ne vous appartient pas.",
        status: "not_found",
      };
    }

    return { data: search, status: "ready" };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Lecture Supabase impossible.",
      status: "error",
    };
  }
}

export async function clientOwnsBuyerSearch(clientAccountId: string, searchId: string) {
  const searches = await clientSupabaseRequest<Array<{ id: string }>>(
    `buyer_searches?id=eq.${encodeURIComponent(searchId)}&client_account_id=eq.${encodeURIComponent(clientAccountId)}&select=id&limit=1`,
  );

  return Boolean(searches[0]);
}
