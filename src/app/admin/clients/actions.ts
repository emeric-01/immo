"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin/auth";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { createCrmContact, createInternalBuyerSearch, createInternalEstimation, getCrmContact } from "@/lib/admin/crm-contacts";

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

export async function createInternalSearchAction(contactId: string, formData: FormData) {
  const session = await requireAdminSession();
  await requireAdminPermission(session, "buyer_searches:read");
  const contact = await requireContact(contactId, session);
  const result = await createInternalBuyerSearch(contact, session, formData);
  if (!result.success) redirect(`/admin/clients/crm/${contactId}?searchError=${encodeURIComponent(result.message)}`);
  revalidatePath(`/admin/clients/crm/${contactId}`);
  revalidatePath("/admin/recherches");
  redirect(`/admin/clients/crm/${contactId}?searchCreated=1`);
}

export async function createInternalEstimationAction(contactId: string, formData: FormData) {
  const session = await requireAdminSession();
  await requireAdminPermission(session, "estimations:read");
  const contact = await requireContact(contactId, session);
  const result = await createInternalEstimation(contact, session, formData);
  if (!result.success) redirect(`/admin/clients/crm/${contactId}?estimationError=${encodeURIComponent(result.message)}`);
  revalidatePath(`/admin/clients/crm/${contactId}`);
  revalidatePath("/admin/estimations");
  redirect(`/admin/clients/crm/${contactId}?estimationCreated=1`);
}

async function requireContact(contactId: string, session: Awaited<ReturnType<typeof requireAdminSession>>) {
  const result = await getCrmContact(contactId, session);
  if (result.status !== "ready" || !result.data) redirect("/admin/clients");
  return result.data.contact;
}
