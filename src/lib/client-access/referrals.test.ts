import { afterEach, describe, expect, it, vi } from "vitest";
import { getClientReferrals } from "./referrals";

vi.mock("server-only", () => ({}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("client referrals", () => {
  it("loads referrals by account and email without duplicates", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-test");
    const referral = {
      created_at: "2026-07-23T08:00:00.000Z",
      id: "referral-1",
      project_kind: "buy",
      property_city: "Gémenos",
      property_type: "house",
      referred_first_name: "Claire",
      referred_last_name: "Martin",
      reward_paid_at: null,
      sponsor_client_account_id: "account-1",
      sponsor_email: "client@example.com",
      status: "new",
      updated_at: "2026-07-23T08:00:00.000Z",
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json([referral]))
      .mockResolvedValueOnce(Response.json([referral]));
    vi.stubGlobal("fetch", fetchMock);

    const rows = await getClientReferrals({
      email: "CLIENT@EXAMPLE.COM",
      firstName: "Jean",
      id: "account-1",
      lastName: "Dupont",
    });

    expect(rows).toHaveLength(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("sponsor_client_account_id=eq.account-1");
    expect(String(fetchMock.mock.calls[1][0])).toContain("sponsor_email=eq.client%40example.com");
  });
});
