import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getAttributionNotificationContext } = vi.hoisted(() => ({
  getAttributionNotificationContext: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/attribution", () => ({ getAttributionNotificationContext }));

import { sendSellerLeadNotificationEmail } from "./buyer-search-emails";

describe("seller lead email routing", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_NOTIFICATION_EMAIL", "admin@jumellesimmo.fr");
    vi.stubEnv("BREVO_API_KEY", "test-brevo-key");
    vi.stubEnv("EMAIL_FROM", "Les Jumelles Immo <contact@jumellesimmo.fr>");
    vi.stubEnv("EMAIL_PROVIDER", "brevo");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 201 })));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("envoie la demande à l'admin et à l'agent attribué", async () => {
    getAttributionNotificationContext.mockResolvedValue({
      agentEmail: "agent@jumellesimmo.fr",
      agentName: "Agent Test",
      campaign: "agent",
      label: "Lien d’affiliation — Agent Test (agent-test / referral)",
      medium: "referral",
      source: "agent-test",
    });

    await sendSellerLeadNotificationEmail({
      address: "10 rue de la République, Aubagne",
      attribution: { attributedAdminUserId: "agent-id" } as never,
      city: "Aubagne",
      email: "vendeur@example.fr",
      firstName: "Jean",
      lastName: "Dupont",
      phone: "0612345678",
      propertyType: "house",
      requestType: "detailed_study",
    });

    const request = vi.mocked(fetch).mock.calls[0];
    const payload = JSON.parse(String(request?.[1]?.body));

    expect(payload.to).toEqual([
      { email: "admin@jumellesimmo.fr" },
      { email: "agent@jumellesimmo.fr" },
    ]);
    expect(payload.htmlContent).toContain("Origine de la demande");
    expect(payload.htmlContent).toContain("Agent Test");
  });

  it("envoie toujours la demande à l'admin sans attribution", async () => {
    getAttributionNotificationContext.mockResolvedValue({
      agentEmail: null,
      agentName: null,
      campaign: null,
      label: "Accès direct — origine non attribuée",
      medium: "none",
      source: "direct",
    });

    await sendSellerLeadNotificationEmail({
      address: "10 rue de la République, Aubagne",
      city: "Aubagne",
      email: "vendeur@example.fr",
      firstName: "Jean",
      lastName: "Dupont",
      phone: "0612345678",
      propertyType: "house",
      requestType: "human_estimate",
    });

    const request = vi.mocked(fetch).mock.calls[0];
    const payload = JSON.parse(String(request?.[1]?.body));

    expect(payload.to).toEqual([{ email: "admin@jumellesimmo.fr" }]);
    expect(payload.textContent).toContain("Origine : Accès direct");
  });
});
