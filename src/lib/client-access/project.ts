import "server-only";

import { enrichMarketScoreTrends } from "@/lib/buyer-search/market-score";
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
  deleted_at: string | null;
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
      `buyer_searches?client_account_id=eq.${encodeURIComponent(session.id)}&status=neq.deleted_by_client&select=*&order=created_at.desc`,
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
      `buyer_searches?id=eq.${encodeURIComponent(searchId)}&client_account_id=eq.${encodeURIComponent(session.id)}&status=neq.deleted_by_client&select=*&limit=1`,
    );
    const search = searches[0];

    if (!search) {
      return {
        message: "Cette recherche n'existe pas ou ne vous appartient pas.",
        status: "not_found",
      };
    }

    const enrichedScore = search.market_score_payload
      ? await enrichMarketScoreTrends(search.market_score_payload)
      : null;

    if (
      enrichedScore &&
      enrichedScore !== search.market_score_payload
    ) {
      await clientSupabaseRequest(
        `buyer_searches?id=eq.${encodeURIComponent(search.id)}`,
        {
          body: JSON.stringify({ market_score_payload: enrichedScore }),
          headers: { Prefer: "return=minimal" },
          method: "PATCH",
        },
      );
    }

    return {
      data: {
        ...search,
        market_score_payload: enrichedScore,
      },
      status: "ready",
    };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Lecture Supabase impossible.",
      status: "error",
    };
  }
}

export async function clientOwnsBuyerSearch(clientAccountId: string, searchId: string) {
  const searches = await clientSupabaseRequest<Array<{ id: string }>>(
    `buyer_searches?id=eq.${encodeURIComponent(searchId)}&client_account_id=eq.${encodeURIComponent(clientAccountId)}&status=neq.deleted_by_client&select=id&limit=1`,
  );

  return Boolean(searches[0]);
}

export async function softDeleteClientBuyerSearch(
  clientAccountId: string,
  searchId: string,
) {
  const searches = await clientSupabaseRequest<Array<{ id: string }>>(
    `buyer_searches?id=eq.${encodeURIComponent(searchId)}&client_account_id=eq.${encodeURIComponent(clientAccountId)}&status=neq.deleted_by_client&select=id`,
    {
      body: JSON.stringify({
        deleted_at: new Date().toISOString(),
        status: "deleted_by_client",
      }),
      headers: { Prefer: "return=representation" },
      method: "PATCH",
    },
  );

  return Boolean(searches[0]);
}
