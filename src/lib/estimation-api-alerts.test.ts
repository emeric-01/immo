import { describe, expect, it } from "vitest";
import { estimationHourlyIpLimit, isEstimationRateLimited } from "./estimation-api-alerts";

describe("isEstimationRateLimited", () => {
  const counter = (ipCount: number) => ({
    alert_global: false,
    alert_ip: false,
    bucket_started_at: "2026-09-02T10:00:00.000Z",
    global_count: ipCount,
    ip_count: ipCount,
  });

  it("allows the configured number of paid estimations", () => {
    expect(isEstimationRateLimited(counter(estimationHourlyIpLimit))).toBe(false);
  });

  it("blocks subsequent estimations in the same hour", () => {
    expect(isEstimationRateLimited(counter(estimationHourlyIpLimit + 1))).toBe(true);
  });

  it("fails open if the usage counter is unavailable", () => {
    expect(isEstimationRateLimited(null)).toBe(false);
  });
});
