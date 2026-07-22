import "server-only";

import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { sendClientLoginCodeEmail } from "@/lib/email/buyer-search-emails";
import { setClientSession } from "./auth";
import { clientSupabaseRequest } from "./supabase";

type ClientAccount = {
  access_enabled: boolean;
  email: string;
  first_name: string;
  id: string;
  last_name: string;
  phone: string;
};

type LoginChallenge = {
  attempt_count: number;
  client_account_id: string;
  code_hash: string;
  expires_at: string;
  id: string;
};

const challengeDurationMinutes = 10;
const resendDelaySeconds = 60;

export async function requestClientLoginCode({
  email,
  ipAddress,
  userAgent,
}: {
  email: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const normalizedEmail = email.trim().toLowerCase();
  const account = await findClientAccount(normalizedEmail);

  // Keep the public response identical whether or not the account exists.
  if (!account?.access_enabled) {
    return;
  }

  const recentAfter = new Date(Date.now() - resendDelaySeconds * 1000).toISOString();
  const recent = await clientSupabaseRequest<Array<{ id: string }>>(
    `client_login_challenges?client_account_id=eq.${encodeURIComponent(account.id)}&created_at=gte.${encodeURIComponent(recentAfter)}&consumed_at=is.null&select=id&limit=1`,
  );

  if (recent[0]) {
    return;
  }

  const code = String(randomInt(100000, 1000000));
  const expiresAt = new Date(Date.now() + challengeDurationMinutes * 60 * 1000).toISOString();
  const challenge = await clientSupabaseRequest<Array<{ id: string }>>(
    "client_login_challenges?select=id",
    {
      body: JSON.stringify({
        client_account_id: account.id,
        code_hash: hashLoginCode(account.id, code),
        expires_at: expiresAt,
        request_ip: ipAddress ?? null,
        user_agent: userAgent ?? null,
      }),
      headers: { Prefer: "return=representation" },
      method: "POST",
    },
  );

  try {
    await sendClientLoginCodeEmail({
      code,
      email: account.email,
      firstName: account.first_name,
    });
  } catch (error) {
    const challengeId = challenge[0]?.id;

    if (challengeId) {
      await clientSupabaseRequest(
        `client_login_challenges?id=eq.${encodeURIComponent(challengeId)}`,
        {
          body: JSON.stringify({ consumed_at: new Date().toISOString() }),
          headers: { Prefer: "return=minimal" },
          method: "PATCH",
        },
      );
    }

    throw error;
  }
}

export async function verifyClientLoginCode(email: string, code: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const account = await findClientAccount(normalizedEmail);

  if (!account?.access_enabled) {
    return false;
  }

  const now = new Date().toISOString();
  const challenges = await clientSupabaseRequest<LoginChallenge[]>(
    `client_login_challenges?client_account_id=eq.${encodeURIComponent(account.id)}&consumed_at=is.null&expires_at=gt.${encodeURIComponent(now)}&attempt_count=lt.5&select=id,client_account_id,code_hash,expires_at,attempt_count&order=created_at.desc&limit=1`,
  );
  const challenge = challenges[0];

  if (!challenge) {
    return false;
  }

  const expected = Buffer.from(challenge.code_hash);
  const received = Buffer.from(hashLoginCode(account.id, code));
  const isValid =
    expected.length === received.length && timingSafeEqual(expected, received);

  await clientSupabaseRequest(
    `client_login_challenges?id=eq.${encodeURIComponent(challenge.id)}`,
    {
      body: JSON.stringify(
        isValid
          ? { consumed_at: new Date().toISOString() }
          : { attempt_count: challenge.attempt_count + 1 },
      ),
      headers: { Prefer: "return=minimal" },
      method: "PATCH",
    },
  );

  if (!isValid) {
    return false;
  }

  await Promise.all([
    clientSupabaseRequest(
      `client_accounts?id=eq.${encodeURIComponent(account.id)}`,
      {
        body: JSON.stringify({ last_login_at: new Date().toISOString() }),
        headers: { Prefer: "return=minimal" },
        method: "PATCH",
      },
    ),
    setClientSession({
      email: account.email,
      firstName: account.first_name,
      id: account.id,
      lastName: account.last_name,
      phone: account.phone,
    }),
  ]);

  return true;
}

async function findClientAccount(email: string) {
  const accounts = await clientSupabaseRequest<ClientAccount[]>(
    `client_accounts?email=eq.${encodeURIComponent(email)}&select=id,email,first_name,last_name,phone,access_enabled&limit=1`,
  );

  return accounts[0] ?? null;
}

function hashLoginCode(accountId: string, code: string) {
  const secret =
    process.env.CLIENT_ACCESS_SECRET?.trim() ||
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!secret) {
    throw new Error("CLIENT_ACCESS_SECRET est requis pour l'authentification client.");
  }

  return createHmac("sha256", secret)
    .update(`${accountId}:${code.trim()}`)
    .digest("hex");
}
