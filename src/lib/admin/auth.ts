import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authenticateAdminUser, isAdminUsersDatabaseConfigured, type SafeAdminUser } from "./users";

const adminCookieName = "les-jumelles-admin";
const sessionDurationSeconds = 60 * 60 * 8;

export type AdminSession = {
  email: string;
  fullName: string;
  id: string;
  role: SafeAdminUser["role"] | "bootstrap";
};

function getAdminToken() {
  return process.env.ADMIN_ACCESS_TOKEN?.trim() ?? "";
}

function getSessionSecret() {
  return (
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    getAdminToken()
  );
}

export function isAdminAccessConfigured() {
  return isAdminUsersDatabaseConfigured() || getAdminToken().length >= 12;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const secret = getSessionSecret();

  if (!secret) {
    return null;
  }

  const cookieStore = await cookies();
  const cookie = cookieStore.get(adminCookieName)?.value;

  if (!cookie) {
    return null;
  }

  return verifySessionCookie(cookie, secret);
}

export async function requireAdminSession() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return session;
}

export async function setAdminSession(email: string, password: string) {
  const adminUser = await authenticateAdminUser(email, password);

  if (adminUser) {
    await writeSessionCookie({
      email: adminUser.email,
      fullName: adminUser.full_name,
      id: adminUser.id,
      role: adminUser.role,
    });
    return true;
  }

  const token = getAdminToken();

  if (!token || password !== token) {
    return false;
  }

  await writeSessionCookie({
    email: email.trim().toLowerCase() || "bootstrap@les-jumelles.local",
    fullName: "Acces bootstrap",
    id: "bootstrap",
    role: "bootstrap",
  });

  return true;
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(adminCookieName, "", { httpOnly: true, maxAge: 0, path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production" });
}

async function writeSessionCookie(session: AdminSession) {
  const secret = getSessionSecret();

  if (!secret) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set(adminCookieName, signSession(session, secret), {
    httpOnly: true,
    maxAge: sessionDurationSeconds,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

function signSession(session: AdminSession, secret: string) {
  const payload = Buffer.from(
    JSON.stringify({
      ...session,
      exp: Math.floor(Date.now() / 1000) + sessionDurationSeconds,
    }),
  ).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");

  return `${payload}.${signature}`;
}

function verifySessionCookie(value: string, secret: string): AdminSession | null {
  const [payload, signature] = value.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = createHmac("sha256", secret).update(payload).digest("base64url");
  const expected = Buffer.from(expectedSignature);
  const received = Buffer.from(signature);

  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AdminSession & { exp: number };

    if (!decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      email: decoded.email,
      fullName: decoded.fullName,
      id: decoded.id,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}
