import { afterEach, describe, expect, it, vi } from "vitest";
import { getClientBuyerSearches, softDeleteClientBuyerSearch } from "./project";

vi.mock("server-only", () => ({}));

const session = {
  email: "client@example.com",
  firstName: "Jean",
  id: "client-account-123",
  lastName: "Test",
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("client buyer search access", () => {
  it("only soft-deletes a search owned by the authenticated client", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-test");
    const fetchMock = vi.fn().mockResolvedValue(Response.json([{ id: "search-456" }]));
    vi.stubGlobal("fetch", fetchMock);

    await expect(softDeleteClientBuyerSearch(session.id, "search-456")).resolves.toBe(true);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("id=eq.search-456");
    expect(url).toContain("client_account_id=eq.client-account-123");
    expect(url).toContain("status=neq.deleted_by_client");
    expect(init).toMatchObject({ method: "PATCH" });
    expect(JSON.parse(String(init.body))).toMatchObject({
      status: "deleted_by_client",
    });
  });

  it("excludes deleted searches from the client dashboard", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-test");
    const fetchMock = vi.fn().mockResolvedValue(Response.json([]));
    vi.stubGlobal("fetch", fetchMock);

    await getClientBuyerSearches(session);

    expect(String(fetchMock.mock.calls[0][0])).toContain("status=neq.deleted_by_client");
  });
});
