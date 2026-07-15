"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { clearClientSession } from "@/lib/client-access/auth";
import { requestClientLoginCode, verifyClientLoginCode } from "@/lib/client-access/login";

export async function requestLoginCode(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const requestHeaders = await headers();

  if (!email || !email.includes("@")) {
    redirect("/client/login?error=invalid_email");
  }

  try {
    await requestClientLoginCode({
      email,
      ipAddress: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      userAgent: requestHeaders.get("user-agent"),
    });
  } catch (error) {
    console.error("Client login code delivery failed", error);
    redirect(`/client/login?email=${encodeURIComponent(email)}&error=delivery`);
  }

  redirect(`/client/login?email=${encodeURIComponent(email)}&sent=1`);
}

export async function verifyLoginCode(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const code = String(formData.get("code") ?? "").trim();
  const success = await verifyClientLoginCode(email, code);

  if (!success) {
    redirect(`/client/login?email=${encodeURIComponent(email)}&sent=1&error=invalid_code`);
  }

  redirect("/client");
}

export async function logoutClient() {
  await clearClientSession();
  redirect("/client/login");
}
