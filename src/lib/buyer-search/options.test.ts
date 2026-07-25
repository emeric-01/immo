import { describe, expect, it } from "vitest";
import { normalizePreferredChannels, preferredChannelLabels } from "./options";

describe("buyer search preferred channels", () => {
  it("keeps several unique contact channels", () => {
    expect(normalizePreferredChannels(["email", "sms", "email", "phone"])).toEqual([
      "email",
      "sms",
      "phone",
    ]);
  });

  it("keeps legacy single-channel searches compatible", () => {
    expect(normalizePreferredChannels("phone")).toEqual(["phone"]);
  });

  it("formats all selected channels for the backoffice", () => {
    expect(preferredChannelLabels(["email", "sms"])).toBe("Par email, Par SMS");
  });
});
