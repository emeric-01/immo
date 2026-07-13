import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const clientCookieName = "les-jumelles-client";
const sessionDurationSeconds = 60 * 60 * 24 * 30;

export type ClientSession = {
  email: string;
  firstName: string;
  id: string;
  lastName: string;
  reference: string;
};

function getSessionSecret() {
  return (
    process.env.CLIENT_ACCESS_SECRET?.trim() ||
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
}

export async function getClientSession(): Promise<ClientSession | null> {
  const secret = getSessionSecret();

  if (!secret) {
    return null;
  }

  const cookieStore = await cookies();
  const cookie = cookieStore.get(clientCookieName)?.value;

  if (!cookie) {
    return null;
  }

  return verifySessionCookie(cookie, secret);
}

export async function requireClientSession() {
  const session = await getClientSession();

  if (!session) {
    redirect("/client/login");
  }

  return session;
}

export async function setClientSession(session: ClientSession) {
  const secret = getSessionSecret();

  if (!secret) {
    return false;
  }

  const cookieStore = await cookies();
  cookieStore.set(clientCookieName, signSession(session, secret), {
    httpOnly: true,
    maxAge: sessionDurationSeconds,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return true;
}

export async function clearClientSession() {
  const cookieStore = await cookies();
  cookieStore.delete(clientCookieName);
}

function signSession(session: ClientSession, secret: string) {
  const payload = Buffer.from(
    JSON.stringify({
      ...session,
      exp: Math.floor(Date.now() / 1000) + sessionDurationSeconds,
    }),
  ).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");

  return `${payload}.${signature}`;
}

function verifySessionCookie(value: string, secret: string): ClientSession | null {
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
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as ClientSession & { exp: number };

    if (!decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      email: decoded.email,
      firstName: decoded.firstName,
      id: decoded.id,
      lastName: decoded.lastName,
      reference: decoded.reference,
    };
  } catch {
    return null;
  }
}
