"use server";

import { redirect } from "next/navigation";
import { clearAdminSession, setAdminSession } from "@/lib/admin/auth";

export async function loginAdmin(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const success = await setAdminSession(email, password);

  if (!success) {
    redirect("/admin/login?error=1");
  }

  redirect("/admin/recherches");
}

export async function logoutAdmin() {
  await clearAdminSession();
  redirect("/admin/login");
}
