import { afterEach, describe, expect, it, vi } from "vitest";
import { createReferral, type ReferralInput } from "./referrals";

vi.mock("server-only", () => ({}));

const input: ReferralInput = {
  informedConsent: true,
  message: "Projet familial",
  privacyConsent: true,
  projectKind: "sell",
  propertyCity: "Aubagne",
  propertyType: "house",
  referredEmail: "proche@example.com",
  referredFirstName: "Claire",
  referredLastName: "Martin",
  referredPhone: "06 22 33 44 55",
  sponsorEmail: "PARRAIN@EXAMPLE.COM",
  sponsorFirstName: "Jean",
  sponsorLastName: "Dupont",
  sponsorPhone: "06 11 22 33 44",
  website: "",
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("referral account linking", () => {
  it("links the referral when the sponsor account already exists", async () => {
    configureSupabase();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json([{ id: "account-123" }]))
      .mockResolvedValueOnce(Response.json([{ id: "referral-456" }]));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createReferral(input)).resolves.toEqual({ id: "referral-456" });

    expect(String(fetchMock.mock.calls[0][0])).toContain("client_accounts?email=eq.parrain%40example.com");
    const body = JSON.parse(String((fetchMock.mock.calls[1][1] as RequestInit).body));
    expect(body).toMatchObject({
      sponsor_client_account_id: "account-123",
      sponsor_email: "parrain@example.com",
    });
  });

  it("keeps a standalone referral without creating an account", async () => {
    configureSupabase();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json([]))
      .mockResolvedValueOnce(Response.json([{ id: "referral-789" }]));
    vi.stubGlobal("fetch", fetchMock);

    await createReferral(input);

    const requestedUrls = fetchMock.mock.calls.map(([url]) => String(url));
    expect(requestedUrls).toHaveLength(2);
    expect(requestedUrls.every((url) => !url.includes("client_accounts?select=id"))).toBe(true);
    const body = JSON.parse(String((fetchMock.mock.calls[1][1] as RequestInit).body));
    expect(body.sponsor_client_account_id).toBeNull();
  });
});

function configureSupabase() {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-test");
}
