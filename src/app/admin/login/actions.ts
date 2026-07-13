"use server";

import { redirect } from "next/navigation";
import { clearAdminSession, setAdminSession } from "@/lib/admin/auth";

export async function loginAdmin(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const success = await setAdminSession(token);

  if (!success) {
    redirect("/admin/login?error=1");
  }

  redirect("/admin/recherches");
}

export async function logoutAdmin() {
  await clearAdminSession();
  redirect("/admin/login");
}
