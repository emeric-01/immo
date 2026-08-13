"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin/auth";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { createCrmContact, updateCrmContact } from "@/lib/admin/crm-contacts";
import { hasAdminPermission } from "@/lib/admin/permissions";

export async function createCrmContactAction(formData: FormData) {
  const session = await requireAdminSession();
  await requireAdminPermission(session, "clients:read");
  const result = await createCrmContact({
    assignedAdminUserId: String(formData.get("assignedAdminUserId") ?? "") || null,
    email: String(formData.get("email") ?? ""),
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  }, session);
  if (!result.success) redirect(`/admin/clients/nouveau?error=${encodeURIComponent(result.message)}`);
  revalidatePath("/admin/clients");
  redirect(`/admin/clients/crm/${result.contact.id}?created=1`);
}

export async function updateCrmContactAction(formData: FormData) {
  const session = await requireAdminSession();
  await requireAdminPermission(session, "clients:read");
  if (session.role === "agent" && !(await hasAdminPermission(session, "crm_contacts:update_own"))) throw new Error("Vous ne pouvez pas modifier cette fiche CRM.");
  const id = String(formData.get("id") ?? "");
  const result = await updateCrmContact(id, {
    assignedAdminUserId: String(formData.get("assignedAdminUserId") ?? "") || null,
    email: String(formData.get("email") ?? ""), firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""), notes: String(formData.get("notes") ?? ""),
    phone: String(formData.get("phone") ?? ""), status: String(formData.get("status") ?? "prospect") as "active" | "archived" | "prospect",
  }, session);
  if (!result.success) redirect(`/admin/clients/crm/${id}/modifier?error=${encodeURIComponent(result.message)}`);
  revalidatePath("/admin/clients"); revalidatePath(`/admin/clients/crm/${id}`);
  redirect(`/admin/clients/crm/${id}?updated=1`);
}
