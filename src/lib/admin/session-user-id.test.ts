import { describe, expect, it } from "vitest";
import { getPersistableAdminUserId } from "./session-user-id";

describe("getPersistableAdminUserId", () => {
  it("does not send the bootstrap identifier to UUID database columns", () => {
    expect(getPersistableAdminUserId({ email: "bootstrap@example.test", fullName: "Bootstrap", id: "bootstrap", role: "bootstrap" })).toBeNull();
  });

  it("keeps database-backed admin UUIDs", () => {
    const id = "8c8ab474-8490-4ef6-a666-06f70a48bb73";
    expect(getPersistableAdminUserId({ email: "agent@example.test", fullName: "Agent", id, role: "agent" })).toBe(id);
  });
});
