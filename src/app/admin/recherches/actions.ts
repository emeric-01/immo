"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin/auth";
import { archiveAdminBuyerSearch, restoreAdminBuyerSearch, updateAdminBuyerSearchAssignment } from "@/lib/admin/buyer-searches";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { getAdminUserSummary } from "@/lib/admin/users";

export async function updateBuyerSearchAssignmentAction(formData: FormData) {
  const session = await requireAdminSession();
  await requireAdminPermission(session, "buyer_searches:read");
  if (session.role === "agent") throw new Error("Vous ne pouvez pas réattribuer cette recherche.");
  const id = z.uuid().parse(formData.get("id"));
  const rawAgentId = String(formData.get("assignedAdminUserId") ?? "").trim();
  const assignedAdminUserId = rawAgentId ? z.uuid().parse(rawAgentId) : null;

  if (assignedAdminUserId) {
    const agent = await getAdminUserSummary(assignedAdminUserId);
    if (!agent || agent.role !== "agent") throw new Error("Le commercial sélectionné est indisponible.");
  }

  const result = await updateAdminBuyerSearchAssignment(id, assignedAdminUserId, session);
  if (!result.success) throw new Error(result.message);
  revalidateBuyerSearchPaths(id);
}

export async function updateBuyerSearchArchiveAction(formData: FormData) {
  const session = await requireAdminSession();
  await requireAdminPermission(session, "buyer_searches:read");
  if (session.role === "agent") throw new Error("Vous ne pouvez pas archiver ou restaurer cette recherche.");
  const id = z.uuid().parse(formData.get("id"));
  const operation = z.enum(["archive", "restore"]).parse(formData.get("operation"));
  const result = operation === "archive"
    ? await archiveAdminBuyerSearch(id, session)
    : await restoreAdminBuyerSearch(id, session);
  if (!result.success) throw new Error(result.message);
  revalidateBuyerSearchPaths(id);
}

function revalidateBuyerSearchPaths(id: string) {
  revalidatePath("/admin/recherches");
  revalidatePath(`/admin/recherches/${id}`);
  revalidatePath("/client");
  revalidatePath(`/client/recherches/${id}`);
}
