import "server-only";

import { createHash } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const adminCookieName = "les-jumelles-admin";
const sessionDurationSeconds = 60 * 60 * 8;

function getAdminToken() {
  return process.env.ADMIN_ACCESS_TOKEN?.trim() ?? "";
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function isAdminAccessConfigured() {
  return getAdminToken().length >= 12;
}

export async function getAdminSession() {
  const token = getAdminToken();

  if (!token) {
    return false;
  }

  const cookieStore = await cookies();
  return cookieStore.get(adminCookieName)?.value === hashToken(token);
}

export async function requireAdminSession() {
  if (!(await getAdminSession())) {
    redirect("/admin/login");
  }
}

export async function setAdminSession(candidate: string) {
  const token = getAdminToken();

  if (!token || candidate !== token) {
    return false;
  }

  const cookieStore = await cookies();
  cookieStore.set(adminCookieName, hashToken(token), {
    httpOnly: true,
    maxAge: sessionDurationSeconds,
    path: "/admin",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return true;
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(adminCookieName);
}
