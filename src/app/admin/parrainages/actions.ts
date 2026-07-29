"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin/auth";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { updateAdminReferralStatus } from "@/lib/admin/referrals";
import { referralStatuses } from "@/lib/referrals";

const statusSchema = z.enum(referralStatuses);

export async function updateReferralStatusAction(formData: FormData) {
  const session = await requireAdminSession();
  await requireAdminPermission(session, "referrals:read");
  const id = z.uuid().parse(formData.get("id"));
  const status = statusSchema.parse(formData.get("status"));

  await updateAdminReferralStatus(id, status, session);
  revalidatePath("/admin/parrainages");
  revalidatePath(`/admin/parrainages/${id}`);
}
