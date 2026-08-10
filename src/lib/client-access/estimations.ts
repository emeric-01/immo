import "server-only";

import type {
  PropertyEstimation,
  PropertyEstimationInput,
  RealtyType,
} from "@/lib/immo-data";
import type { ClientSession } from "./auth";
import { clientSupabaseRequest } from "./supabase";
import { attributionColumns, type AttributionSnapshot } from "@/lib/attribution";

export type ClientEstimationRow = {
  address_label: string;
  city_name: string | null;
  client_account_id: string | null;
  confidence_score: number | null;
  created_at: string;
  high_price: number;
  generated_high_price?: number;
  generated_low_price?: number;
  generated_median_price?: number;
  generated_result_payload?: PropertyEstimation;
  id: string;
  input_payload: PropertyEstimationInput;
  low_price: number;
  median_price: number;
  postal_code: string | null;
  price_per_m2: number;
  property_type: RealtyType;
  result_payload: PropertyEstimation;
  rooms: number;
  source: string;
  status: "active" | "archived";
  surface_m2: number;
  updated_at: string;
  range_adjusted?: boolean;
  range_adjusted_at?: string | null;
  range_adjusted_by_admin_user_id?: string | null;
  attributed_admin_user_id?: string | null;
  assigned_admin_user_id?: string | null;
  attribution_snapshot?: AttributionSnapshot | Record<string, never>;
  created_by_admin_user_id?: string | null;
  crm_contact_id?: string | null;
  record_origin?: "admin" | "client" | "public";
};

export async function savePropertyEstimation(
  session: ClientSession | null,
  input: PropertyEstimationInput,
  result: PropertyEstimation,
  attribution: AttributionSnapshot | null = null,
) {
  const selectedAddress = input.selectedAddress;
  const rows = await clientSupabaseRequest<Array<{ id: string }>>(
    "property_estimations?select=id",
    {
      body: JSON.stringify({
        address_label: result.addressLabel,
        city_name: selectedAddress?.cityName ?? null,
        client_account_id: session?.id ?? null,
        confidence_score: result.confidenceScore,
        high_price: result.highPrice,
        generated_high_price: result.highPrice,
        input_payload: input,
        low_price: result.lowPrice,
        generated_low_price: result.lowPrice,
        median_price: result.medianPrice,
        generated_median_price: result.medianPrice,
        generated_result_payload: result,
        postal_code: selectedAddress?.postCode?.[0] ?? null,
        price_per_m2: result.pricePerM2,
        property_type: input.propertyType,
        result_payload: result,
        record_origin: session ? "client" : "public",
        rooms: input.rooms,
        source: result.source,
        surface_m2: input.surfaceM2,
        ...attributionColumns(attribution),
      }),
      headers: { Prefer: "return=representation" },
      method: "POST",
    },
  );

  return rows[0]?.id ?? null;
}

export async function getClientEstimations(session: ClientSession) {
  try {
    return await clientSupabaseRequest<ClientEstimationRow[]>(
      `property_estimations?client_account_id=eq.${encodeURIComponent(session.id)}&status=eq.active&select=*&order=created_at.desc`,
    );
  } catch (error) {
    console.error("Client estimations load failed", error);
    return [];
  }
}

export async function getClientEstimation(session: ClientSession, estimationId: string) {
  try {
    const rows = await clientSupabaseRequest<ClientEstimationRow[]>(
      `property_estimations?id=eq.${encodeURIComponent(estimationId)}&client_account_id=eq.${encodeURIComponent(session.id)}&status=eq.active&select=*&limit=1`,
    );

    return rows[0] ?? null;
  } catch (error) {
    console.error("Client estimation load failed", error);
    return null;
  }
}
