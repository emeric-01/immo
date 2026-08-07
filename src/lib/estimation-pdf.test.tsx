// @vitest-environment node

import { describe, expect, it, vi } from "vitest";
import { readFile, writeFile } from "node:fs/promises";
import type { AdminEstimation } from "@/lib/admin/estimations";

vi.mock("server-only", () => ({}));

import { estimationPdfFileName, renderEstimationPdf, renderWorkspaceEstimationPdf } from "@/lib/estimation-pdf";
import type { InseeHousingProfile } from "@/lib/insee-housing";
import type { EstimationAgentWorkspace } from "@/lib/admin/estimation-workspaces";

const inseeProfile: InseeHousingProfile = {
  cityName: "Aubagne", inseeCode: "13005", vintage: 2022, sourceUrl: "https://www.insee.fr/fr/statistiques/8647012", totalHousing: 22859,
  housingTypes: [{ label: "Maisons", value: 8496 }, { label: "Appartements", value: 14223 }],
  occupancy: [{ label: "Résidences principales", value: 20999 }, { label: "Résidences secondaires", value: 287 }, { label: "Logements vacants", value: 1573 }],
  tenure: [{ label: "Propriétaires", value: 10320 }, { label: "Locataires", value: 10125 }, { label: "Logés gratuitement", value: 555 }],
  rooms: [{ label: "1 pièce", value: 660 }, { label: "2 pièces", value: 2836 }, { label: "3 pièces", value: 6808 }, { label: "4 pièces", value: 6386 }, { label: "5 pièces ou +", value: 4309 }],
  surfaces: [{ label: "< 30 m²", value: 631 }, { label: "30-40 m²", value: 1390 }, { label: "40-60 m²", value: 3553 }, { label: "60-80 m²", value: 7136 }, { label: "80-100 m²", value: 4225 }, { label: "100-120 m²", value: 2017 }, { label: "> 120 m²", value: 2048 }],
  construction: [{ label: "Avant 1919", value: 1477 }, { label: "1919-1945", value: 1484 }, { label: "1946-1970", value: 5279 }, { label: "1971-1990", value: 7103 }, { label: "1991-2005", value: 3059 }, { label: "2006-2019", value: 2263 }],
  moveIn: [{ label: "< 2 ans", value: 2213 }, { label: "2-4 ans", value: 4347 }, { label: "5-9 ans", value: 3886 }, { label: "10 ans ou +", value: 10554 }],
};

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
    coordinates: { latitude: 43.301288, longitude: 5.580412 },
    comparables: [
      { id: "sale-1", label: "Route des Aubes", price: 392000, pricePerM2: 3267, propertyType: "apartment", rooms: 4, surfaceM2: 120, distanceMeters: 180, soldAt: "2026-03-12" },
      { id: "sale-2", label: "Quartier des Passons", price: 415000, pricePerM2: 3458, propertyType: "apartment", rooms: 4, surfaceM2: 120, distanceMeters: 640, soldAt: "2025-11-05" },
    ],
    confidence: "high",
    confidenceScore: 4,
    highPrice: 423100,
    lowPrice: 375200,
    market: { demandLevel: "Bonne demande", priceEvolution12Months: 1.8, saleDurationDays: 56, sectorPricePerM2: 3210, supplyLevel: "Modere", cityPriceHistory: Array.from({ length: 12 }, (_, index) => ({ period: String(2015 + index), apartment: 2780 + index * 52 + (index % 3) * 35, house: 3010 + index * 48 })) },
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
    const pdf = await renderEstimationPdf(estimation, { email: "severine@lesjumelles.immo", full_name: "Séverine Masfrand" }, { inseeProfile, reportVersion: 1 });
    if (process.env.WRITE_ESTIMATION_PDF_FIXTURE) await writeFile("output/pdf/estimation-aubagne-insee-exemple.pdf", pdf);
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(20_000);
  }, 20_000);

  it("builds a stable filename", () => {
    expect(estimationPdfFileName(estimation)).toBe("estimation-595-route-des-aubes-13400-aubagne.pdf");
  });

  it("generates a modular agent report in the configured order", async () => {
    const workspace = {
      id: "83b6e179-b4f7-42ba-9874-f1f3bcb40922", source_estimation_id: estimation.id, created_at: estimation.created_at, updated_at: estimation.updated_at, created_by_admin_user_id: null, updated_by_admin_user_id: null, assigned_admin_user_id: null, status: "draft", title: "Estimation professionnelle - Route des Aubes", draft_input_payload: estimation.input_payload, draft_result_payload: estimation.result_payload, low_price: 380000, median_price: 405000, high_price: 430000, price_per_m2: 3375,
      agent_analysis: "La luminosité, la distribution et le calme positionnent ce bien au-dessus de la moyenne observée dans son secteur.", strengths: "Volumes équilibrés, extérieur et stationnement.", reservations: "Prévoir une présentation soignée des pièces d’eau.", sale_strategy: "Lancement au prix central, reportage photographique et diffusion ciblée auprès des acquéreurs déjà qualifiés.",
      photos: [{ id: "photo-1", storagePath: "demo/photo-1.webp", name: "Pièce de vie.webp", caption: "Pièce de vie lumineuse", contentType: "image/webp", size: 125000, enabled: true, createdAt: estimation.created_at }],
      report_blocks: ["valuation", "photos", "property", "location", "agent_analysis", "strengths", "price_history", "strategy", "market", "comparables", "insee", "methodology", "agency"].map((id) => ({ enabled: true, id })),
    } as EstimationAgentWorkspace;
    const photo = await readFile("public/images/about/appartement-temoin-piece-de-vie.webp");
    const mapImage = await readFile("public/images/cities/aubagne.webp");
    const pdf = await renderWorkspaceEstimationPdf({ ...estimation, low_price: workspace.low_price, median_price: workspace.median_price, high_price: workspace.high_price, price_per_m2: workspace.price_per_m2 }, workspace, { email: "severine@lesjumelles.immo", full_name: "Séverine Masfrand" }, { inseeProfile, mapImage, photos: [{ buffer: photo, id: "photo-1", photo: workspace.photos[0] }], reportVersion: 1 });
    if (process.env.WRITE_ESTIMATION_PDF_FIXTURE) await writeFile("output/pdf/dossier-agent-modulable-exemple.pdf", pdf);
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(20_000);
  }, 20_000);
});
