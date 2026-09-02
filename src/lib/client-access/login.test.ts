import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./auth", () => ({ setClientSession: vi.fn() }));
vi.mock("./supabase", () => ({ clientSupabaseRequest: vi.fn() }));
vi.mock("@/lib/email/buyer-search-emails", () => ({ sendClientLoginCodeEmail: vi.fn() }));

import { setClientSession } from "./auth";
import { verifyClientLoginCode } from "./login";
import { clientSupabaseRequest } from "./supabase";

const account = {
  access_enabled: true,
  email: "client@example.test",
  first_name: "Camille",
  id: "11111111-1111-4111-8111-111111111111",
  last_name: "Client",
  phone: "0600000000",
};
const secret = "test-secret";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("CLIENT_ACCESS_SECRET", secret);
});

describe("verifyClientLoginCode", () => {
  it("rejects malformed codes before accessing the database", async () => {
    await expect(verifyClientLoginCode(account.email, "12345x")).resolves.toBe(false);
    expect(clientSupabaseRequest).not.toHaveBeenCalled();
  });

  it("does not create a session when another request already consumed the challenge", async () => {
    const code = "123456";
    const codeHash = createHmac("sha256", secret).update(`${account.id}:${code}`).digest("hex");
    vi.mocked(clientSupabaseRequest)
      .mockResolvedValueOnce([account])
      .mockResolvedValueOnce([{
        attempt_count: 0,
        client_account_id: account.id,
        code_hash: codeHash,
        expires_at: new Date(Date.now() + 60_000).toISOString(),
        id: "challenge-id",
      }])
      .mockResolvedValueOnce([]);

    await expect(verifyClientLoginCode(account.email, code)).resolves.toBe(false);
    expect(setClientSession).not.toHaveBeenCalled();
    expect(vi.mocked(clientSupabaseRequest).mock.calls[2]?.[0]).toContain("attempt_count=eq.0&consumed_at=is.null");
  });
});
