"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin/auth";
import { updateAdminEstimationAssignment } from "@/lib/admin/estimations";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { getAdminUserSummary } from "@/lib/admin/users";

export async function updateEstimationAssignmentAction(formData: FormData) {
  const session = await requireAdminSession();
  await requireAdminPermission(session, "estimations:read");
  if (session.role === "agent") throw new Error("Vous ne pouvez pas réattribuer cette estimation.");

  const id = z.uuid().parse(formData.get("id"));
  const rawAgentId = String(formData.get("assignedAdminUserId") ?? "").trim();
  const assignedAdminUserId = rawAgentId ? z.uuid().parse(rawAgentId) : null;

  if (assignedAdminUserId) {
    const agent = await getAdminUserSummary(assignedAdminUserId);
    if (!agent || agent.role !== "agent") throw new Error("Le commercial sélectionné est indisponible.");
  }

  const result = await updateAdminEstimationAssignment(id, assignedAdminUserId, session);
  if (!result.success) throw new Error(result.message);

  revalidatePath("/admin/estimations");
  revalidatePath(`/admin/estimations/${id}`);
}
