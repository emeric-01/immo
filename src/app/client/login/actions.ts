"use server";

import { redirect } from "next/navigation";
import { setClientSession, clearClientSession } from "@/lib/client-access/auth";
import { authenticateClientProject } from "@/lib/client-access/project";

export async function loginClient(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const reference = String(formData.get("reference") ?? "");
  const code = String(formData.get("code") ?? "");
  const loginParams = new URLSearchParams({
    code,
    email,
    reference,
  });

  const result = await authenticateClientProject({ code, email, reference });

  if (result.status !== "ready") {
    loginParams.set("error", result.status);
    redirect(`/client/login?${loginParams.toString()}`);
  }

  const sessionCreated = await setClientSession({
    email: result.data.contact_email,
    firstName: result.data.contact_first_name,
    id: result.data.id,
    lastName: result.data.contact_last_name,
    reference: result.data.client_reference ?? reference.trim().toUpperCase(),
  });

  if (!sessionCreated) {
    loginParams.set("error", "missing_config");
    redirect(`/client/login?${loginParams.toString()}`);
  }

  redirect("/client/projet");
}

export async function logoutClient() {
  await clearClientSession();
  redirect("/client/login");
}
