import { describe, expect, it } from "vitest";
import { stepSchemas } from "./schema";

describe("buyer search step schemas", () => {
  it("rejects a property step when maximum budget is below ideal budget", () => {
    const result = stepSchemas.property.safeParse({
      type: "house",
      idealBudget: 450000,
      maximumBudget: 350000,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("budget maximum");
  });

  it("validates a complete contact step", () => {
    const result = stepSchemas.contact.safeParse({
      firstName: "Claire",
      lastName: "Dupont",
      email: "claire@example.fr",
      phone: "06 12 34 56 78",
      preferredChannel: "email",
      consent: true,
    });

    expect(result.success).toBe(true);
  });
});
