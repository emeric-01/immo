import "server-only";

import type { ClientSession } from "./auth";
import { clientSupabaseRequest } from "./supabase";
import type { ReferralRow } from "@/lib/referrals";

const clientReferralSelect = [
  "id",
  "created_at",
  "updated_at",
  "status",
  "sponsor_client_account_id",
  "sponsor_email",
  "referred_first_name",
  "referred_last_name",
  "project_kind",
  "property_type",
  "property_city",
  "reward_paid_at",
].join(",");

export type ClientReferral = Pick<
  ReferralRow,
  | "created_at"
  | "id"
  | "project_kind"
  | "property_city"
  | "property_type"
  | "referred_first_name"
  | "referred_last_name"
  | "reward_paid_at"
  | "sponsor_client_account_id"
  | "sponsor_email"
  | "status"
  | "updated_at"
>;

export async function getClientReferrals(session: ClientSession): Promise<ClientReferral[]> {
  try {
    const normalizedEmail = session.email.trim().toLowerCase();
    const [linked, emailMatched] = await Promise.all([
      clientSupabaseRequest<ClientReferral[]>(
        `referral_leads?sponsor_client_account_id=eq.${encodeURIComponent(session.id)}&select=${clientReferralSelect}&order=created_at.desc`,
      ),
      clientSupabaseRequest<ClientReferral[]>(
        `referral_leads?sponsor_email=eq.${encodeURIComponent(normalizedEmail)}&select=${clientReferralSelect}&order=created_at.desc`,
      ),
    ]);

    return [...new Map([...linked, ...emailMatched].map((referral) => [referral.id, referral])).values()]
      .sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at));
  } catch (error) {
    console.error("Client referrals load failed", error);
    return [];
  }
}
