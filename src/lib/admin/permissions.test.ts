import { afterEach, describe, expect, it, vi } from "vitest";
import type { AdminSession } from "./auth";
import { getAdminPermissions } from "./permissions";

const editorSession: AdminSession = {
  email: "agent@example.test",
  fullName: "Agent",
  id: "11111111-1111-4111-8111-111111111111",
  role: "editor",
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("getAdminPermissions", () => {
  it("fails closed when Supabase is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    await expect(getAdminPermissions(editorSession)).resolves.toEqual([]);
  });

  it("fails closed when the permissions request is unavailable", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "secret");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network unavailable")));

    await expect(getAdminPermissions(editorSession)).resolves.toEqual([]);
  });

  it("honours explicit per-user permissions", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "secret");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([
      { is_allowed: true, permission: "properties:create" },
      { is_allowed: false, permission: "properties:write" },
    ]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getAdminPermissions(editorSession)).resolves.toEqual(["properties:create"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
