"use server";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin/auth";
import { restoreDeletedAdminBuyerSearch } from "@/lib/admin/buyer-searches";
import { restoreCrmContact } from "@/lib/admin/crm-contacts";

export async function restoreDeletedItemAction(formData: FormData) {
  const session = await requireAdminSession();
  if (session.role === "agent") throw new Error("Accès refusé.");
  const id = String(formData.get("id") ?? ""); const kind = String(formData.get("kind") ?? "");
  const result = kind === "crm" ? await restoreCrmContact(id) : await restoreDeletedAdminBuyerSearch(id);
  if (!result.success) throw new Error(result.message);
  revalidatePath("/admin/corbeille"); revalidatePath("/admin/clients"); revalidatePath("/admin/recherches");
}
