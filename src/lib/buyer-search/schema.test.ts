import { describe, expect, it } from "vitest";
import { buyerSearchSchema, stepSchemas } from "./schema";
import { defaultBuyerSearchData } from "./types";

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
      preferredChannels: ["email", "sms"],
      preferredChannel: "email",
      consent: true,
    });

    expect(result.success).toBe(true);
  });

  it("requires at least one contact channel", () => {
    const result = stepSchemas.contact.safeParse({
      firstName: "Claire",
      lastName: "Dupont",
      email: "claire@example.fr",
      phone: "06 12 34 56 78",
      preferredChannels: [],
      preferredChannel: null,
      consent: true,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["preferredChannels"]);
  });

  it("keeps accepting a legacy single contact channel", () => {
    const result = stepSchemas.contact.safeParse({
      firstName: "Claire",
      lastName: "Dupont",
      email: "claire@example.fr",
      phone: "06 12 34 56 78",
      preferredChannel: "phone",
      consent: true,
    });

    expect(result.success).toBe(true);
  });
});

describe("buyerSearchSchema resource limits", () => {
  it("keeps the existing empty draft shape valid", () => {
    expect(buyerSearchSchema.safeParse(defaultBuyerSearchData).success).toBe(true);
  });

  it("rejects non-finite budgets", () => {
    const data = {
      ...defaultBuyerSearchData,
      property: { ...defaultBuyerSearchData.property, idealBudget: Number.POSITIVE_INFINITY },
    };

    expect(buyerSearchSchema.safeParse(data).success).toBe(false);
  });

  it("rejects oversized location lists", () => {
    const data = {
      ...defaultBuyerSearchData,
      location: {
        ...defaultBuyerSearchData.location,
        cities: Array.from({ length: 11 }, (_, index) => ({ name: `Ville ${index}` })),
      },
    };

    expect(buyerSearchSchema.safeParse(data).success).toBe(false);
  });
});
