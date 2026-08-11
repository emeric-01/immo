import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminRest } from "@/lib/properties";
import { getSiteAnalytics } from "./site-analytics";

vi.mock("@/lib/properties", () => ({ adminRest: vi.fn() }));

const adminRestMock = vi.mocked(adminRest);

function event(audienceType: "human" | "bot", visitorHash: string | null = null) {
  return {
    audience_type: audienceType,
    bot_name: audienceType === "bot" ? "Googlebot" : null,
    conversion_kind: null,
    created_at: new Date().toISOString(),
    device_type: "desktop" as const,
    event_type: "page_view" as const,
    path: "/",
    referrer_host: null,
    session_hash: visitorHash,
    visitor_hash: visitorHash,
  };
}

describe("site analytics", () => {
  beforeEach(() => {
    adminRestMock.mockReset();
  });

  it("loads every event page when the Data API reaches its 1,000-row limit", async () => {
    adminRestMock.mockImplementation(async (path) => {
      if (path.startsWith("attribution_touches?")) return [];
      if (path.includes("offset=0")) return Array.from({ length: 1_000 }, () => event("bot"));
      if (path.includes("offset=1000")) return [event("human", "visitor-1"), event("human", "visitor-1")];
      return [];
    });

    const summary = await getSiteAnalytics(7);

    expect(summary.totals).toMatchObject({
      botViews: 1_000,
      humanViews: 2,
      uniqueVisitors: 1,
    });
    expect(summary.daily.at(-1)).toMatchObject({ humains: 2, visiteurs: 1 });
    expect(adminRestMock.mock.calls.map(([path]) => path)).toEqual(expect.arrayContaining([
      expect.stringContaining("limit=1000&offset=0"),
      expect.stringContaining("limit=1000&offset=1000"),
    ]));
  });
});
