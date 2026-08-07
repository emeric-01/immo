// @vitest-environment node

import { describe, expect, it, vi } from "vitest";
import { writeFile } from "node:fs/promises";
import type { AdminEstimation } from "@/lib/admin/estimations";

vi.mock("server-only", () => ({}));

import { estimationPdfFileName, renderEstimationPdf } from "@/lib/estimation-pdf";

const estimation = {
  id: "e8a7be15-890b-44ea-a135-d1f985762111",
  address_label: "595 Route des Aubes 13400 Aubagne",
  city_name: "Aubagne",
  postal_code: "13400",
  property_type: "apartment",
  surface_m2: 120,
  rooms: 4,
  low_price: 375200,
  median_price: 399200,
  high_price: 423100,
  generated_low_price: 370000,
  generated_median_price: 395000,
  generated_high_price: 420000,
  price_per_m2: 3327,
  confidence_score: 4,
  range_adjusted: true,
  range_adjusted_at: "2026-08-07T13:39:00.000Z",
  source: "immo-data",
  status: "active",
  created_at: "2026-08-07T13:39:00.000Z",
  updated_at: "2026-08-07T14:00:00.000Z",
  client_account_id: null,
  input_payload: {
    address: "595 Route des Aubes 13400 Aubagne",
    propertyType: "apartment",
    surfaceM2: 120,
    rooms: 4,
    bathrooms: 2,
    condition: "good",
    constructionYear: 1998,
    dpe: "C",
    floor: 2,
    hasCellar: true,
    hasElevator: true,
    hasNiceView: true,
    hasOutdoorSpace: true,
    hasParking: true,
  },
  result_payload: {
    addressLabel: "595 Route des Aubes 13400 Aubagne",
    comparables: [
      { id: "sale-1", label: "Route des Aubes", price: 392000, pricePerM2: 3267, propertyType: "apartment", rooms: 4, surfaceM2: 120, distanceMeters: 180, soldAt: "2026-03-12" },
      { id: "sale-2", label: "Quartier des Passons", price: 415000, pricePerM2: 3458, propertyType: "apartment", rooms: 4, surfaceM2: 120, distanceMeters: 640, soldAt: "2025-11-05" },
    ],
    confidence: "high",
    confidenceScore: 4,
    highPrice: 423100,
    lowPrice: 375200,
    market: { demandLevel: "Bonne demande", priceEvolution12Months: 1.8, saleDurationDays: 56, sectorPricePerM2: 3210, supplyLevel: "Modere" },
    marketSignals: [],
    medianPrice: 399200,
    negativeFactors: [],
    positiveFactors: [],
    pricePerM2: 3327,
    source: "immo-data",
  },
  adminAgent: null,
  client: null,
  crmContact: null,
  record_origin: "admin",
} as AdminEstimation;

describe("estimation PDF", () => {
  it("generates a branded multi-page report", async () => {
    const pdf = await renderEstimationPdf(estimation, { email: "severine@lesjumelles.immo", full_name: "Séverine Masfrand" });
    if (process.env.WRITE_ESTIMATION_PDF_FIXTURE) await writeFile("output/pdf/estimation-aubagne-exemple.pdf", pdf);
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(20_000);
  }, 20_000);

  it("builds a stable filename", () => {
    expect(estimationPdfFileName(estimation)).toBe("estimation-595-route-des-aubes-13400-aubagne.pdf");
  });
});
