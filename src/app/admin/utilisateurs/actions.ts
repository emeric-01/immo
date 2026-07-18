"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin/auth";
import { createAdminUser, type AdminUser } from "@/lib/admin/users";

export async function createAdminUserAction(formData: FormData) {
  await requireAdminSession();

  const result = await createAdminUser({
    email: String(formData.get("email") ?? ""),
    fullName: String(formData.get("fullName") ?? ""),
    password: String(formData.get("password") ?? ""),
    role: parseRole(String(formData.get("role") ?? "manager")),
  });

  if (!result.success) {
    redirect(`/admin/utilisateurs?error=${encodeURIComponent(result.message ?? "Creation impossible")}`);
  }

  revalidatePath("/admin/utilisateurs");
  redirect("/admin/utilisateurs?created=1");
}

function parseRole(value: string): AdminUser["role"] {
  return value === "admin" || value === "editor" ? value : "manager";
}
