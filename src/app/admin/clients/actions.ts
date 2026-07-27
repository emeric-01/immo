"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin/auth";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { createCrmContact } from "@/lib/admin/crm-contacts";

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
