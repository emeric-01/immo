import "server-only";

import { clientSupabaseRequest } from "@/lib/client-access/supabase";
import type { ReferralRow, ReferralStatus } from "@/lib/referrals";
import type { AdminSession } from "@/lib/admin/auth";
import { listAdminUsers, type SafeAdminUser } from "@/lib/admin/users";

export type AdminReferral = ReferralRow & { admin_agent: SafeAdminUser | null };

export type AdminReferralFilters = {
  q?: string;
  status?: string;
};

export type AdminReferralResult<T> =
  | { data: T; status: "ready" }
  | { message: string; status: "missing_config" | "error" };

export async function getAdminReferrals(filters: AdminReferralFilters = {}, session?: AdminSession): Promise<AdminReferralResult<AdminReferral[]>> {
  try {
    const params = new URLSearchParams({
      limit: "1000",
      order: "created_at.desc",
      select: "*",
    });

    if (filters.status && filters.status !== "all") {
      params.set("status", `eq.${filters.status}`);
    }
    if (session?.role === "agent") {
      params.set("or", `(attributed_admin_user_id.eq.${session.id},assigned_admin_user_id.eq.${session.id})`);
    }

    const [referrals, usersResult] = await Promise.all([
      clientSupabaseRequest<ReferralRow[]>(`referral_leads?${params.toString()}`),
      listAdminUsers(),
    ]);
    const users = new Map(usersResult.status === "ready" ? usersResult.data.map((user) => [user.id, user]) : []);
    const hydrated = referrals.map((referral) => ({ ...referral, admin_agent: users.get(referral.assigned_admin_user_id || referral.attributed_admin_user_id || "") ?? null }));
    const query = filters.q?.trim().toLowerCase();

    if (!query) {
      return { data: hydrated, status: "ready" };
    }

    return {
      data: hydrated.filter((referral) =>
        [
          referral.sponsor_first_name,
          referral.sponsor_last_name,
          referral.sponsor_email,
          referral.sponsor_phone,
          referral.referred_first_name,
          referral.referred_last_name,
          referral.referred_email ?? "",
          referral.referred_phone,
          referral.property_city,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query),
      ),
      status: "ready",
    };
  } catch (error) {
    return adminReferralError(error);
  }
}

export async function getAdminReferral(id: string, session?: AdminSession): Promise<AdminReferralResult<AdminReferral | null>> {
  try {
    const [referrals, usersResult] = await Promise.all([
      clientSupabaseRequest<ReferralRow[]>(`referral_leads?id=eq.${encodeURIComponent(id)}${session?.role === "agent" ? `&or=(attributed_admin_user_id.eq.${session.id},assigned_admin_user_id.eq.${session.id})` : ""}&select=*&limit=1`),
      listAdminUsers(),
    ]);
    const referral = referrals[0];
    const agent = referral && usersResult.status === "ready" ? usersResult.data.find((user) => user.id === (referral.assigned_admin_user_id || referral.attributed_admin_user_id)) ?? null : null;

    return { data: referral ? { ...referral, admin_agent: agent } : null, status: "ready" };
  } catch (error) {
    return adminReferralError(error);
  }
}

export async function updateAdminReferralStatus(id: string, status: ReferralStatus, session: AdminSession) {
  const payload: { reward_paid_at?: string; status: ReferralStatus } = { status };

  if (status === "rewarded") {
    payload.reward_paid_at = new Date().toISOString();
  }

  await clientSupabaseRequest(`referral_leads?id=eq.${encodeURIComponent(id)}${session.role === "agent" ? `&or=(attributed_admin_user_id.eq.${session.id},assigned_admin_user_id.eq.${session.id})` : ""}`, {
    body: JSON.stringify(payload),
    headers: { Prefer: "return=minimal" },
    method: "PATCH",
  });
}

export function getAdminReferralStats(referrals: AdminReferral[]) {
  return {
    linkedCount: referrals.filter((referral) => referral.sponsor_client_account_id).length,
    newCount: referrals.filter((referral) => referral.status === "new").length,
    rewardedCount: referrals.filter((referral) => referral.status === "rewarded").length,
    signedCount: referrals.filter((referral) => ["signed", "rewarded"].includes(referral.status)).length,
    total: referrals.length,
  };
}

function adminReferralError(error: unknown): AdminReferralResult<never> {
  const message = error instanceof Error ? error.message : "Lecture des parrainages impossible.";

  return {
    message,
    status: message.includes("n'est pas configure") ? "missing_config" : "error",
  };
}
