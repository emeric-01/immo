// @vitest-environment node

import { describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Property } from "@/lib/properties";

vi.mock("server-only", () => ({}));

import { propertyPdfFileName, renderPropertyPdf } from "@/lib/property-pdf";

const property = {
  id: "21af50e1-9ad4-43cb-b591-123456789abc",
  display_order: 0,
  slug: "villa-contemporaine-gemenos",
  status: "draft",
  title: "Villa contemporaine avec piscine",
  city_name: "Gémenos",
  postal_code: "13420",
  neighborhood: "Quartier résidentiel",
  property_type: "house",
  transaction_type: "sale",
  price: 895000,
  surface_m2: 165,
  rooms: 6,
  bedrooms: 4,
  floor_label: null,
  short_description: "Des volumes lumineux ouverts sur le jardin",
  description: "Une villa familiale avec piscine, terrasse et jardin paysagé.",
  address: null,
  latitude: 43.2989,
  longitude: 5.6284,
  energy_rating: "C",
  condominium_charges_monthly: null,
  property_tax_annual: 2800,
  condominium_lots: null,
  terrace_m2: 40,
  heating: "Climatisation réversible",
  exposure: "Sud",
  construction_year: 2018,
  parking_details: "Garage",
  amenities: ["Piscine", "Climatisation", "Terrasse", "Garage"],
  fees_paid_by: "Vendeur",
  contact_name: "Les Jumelles Immo",
  land_area_m2: 780,
  bathrooms: 2,
  levels: 1,
  parking_spaces: 2,
  property_condition: "Excellent état",
  kitchen_type: "Équipée",
  land_is_buildable: null,
  land_is_serviced: null,
  seo_title: null,
  seo_description: null,
  seo_noindex: false,
  contact_phone: "04 42 00 00 00",
  contact_email: "contact@lesjumelles.immo",
  published_at: null,
  created_at: "2026-07-21T10:00:00.000Z",
  updated_at: null,
  images: [],
} as Property;

describe("property PDF", () => {
  it("generates a valid PDF buffer", async () => {
    const renderedProperty = process.env.WRITE_PROPERTY_PDF_FIXTURE ? await propertyWithGallery() : property;
    const pdf = await renderPropertyPdf(renderedProperty);

    if (process.env.WRITE_PROPERTY_PDF_FIXTURE) {
      await writeFile("tmp/pdfs/fiche-bien-test.pdf", pdf);
    }

    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(10_000);
  }, 20_000);

  it("loads public assets through HTTP when they are absent from the server function", async () => {
    const originalCwd = process.cwd();
    const isolatedCwd = await mkdtemp(path.join(tmpdir(), "property-pdf-"));
    const [logo, fallback] = await Promise.all([
      readFile(path.join(originalCwd, "public/brand/les-jumelles-logo-noir.png")),
      readFile(path.join(originalCwd, "public/images/agence-jumelles-immo-hero.webp")),
    ]);

    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const data = String(input).includes("les-jumelles-logo") ? logo : fallback;
      return new Response(new Uint8Array(data), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    try {
      process.chdir(isolatedCwd);
      const siteOrigin = "https://immobilier.lesjumelles.fr";
      const pdf = await renderPropertyPdf(property, { siteOrigin });
      expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
      expect(pdf.length).toBeGreaterThan(10_000);
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(fetchMock.mock.calls.map(([input]) => String(input))).toEqual(expect.arrayContaining([
        `${siteOrigin}/brand/les-jumelles-logo-noir.png`,
        `${siteOrigin}/images/agence-jumelles-immo-hero.webp`,
        `${siteOrigin}/images/laure-severine-jumelles-immo.jpg`,
      ]));
    } finally {
      process.chdir(originalCwd);
      vi.unstubAllGlobals();
      await rm(isolatedCwd, { force: true, recursive: true });
    }
  }, 20_000);

  it("builds a stable download filename", () => {
    expect(propertyPdfFileName(property)).toBe("fiche-bien-gemenos.pdf");
  });
});

async function propertyWithGallery(): Promise<Property> {
  const files = [
    ["public/images/agence-jumelles-immo-hero.webp", "image/webp"],
    ["public/images/local-agency/maison-piscine-mediterranee.jpg", "image/jpeg"],
    ["public/images/local-agency/appartement-lumineux.webp", "image/webp"],
    ["public/images/local-agency/maison-contemporaine-jardin.jpg", "image/jpeg"],
  ] as const;
  const images = await Promise.all(files.map(async ([filePath, mimeType], index) => ({
    alt_text: `Photo ${index + 1}`,
    id: `photo-${index + 1}`,
    is_cover: index === 0,
    position: index,
    public_url: `data:${mimeType};base64,${(await readFile(filePath)).toString("base64")}`,
  })));

  return {
    ...property,
    description: "Cette villa contemporaine offre de beaux volumes ouverts sur le jardin et une lumière naturelle présente tout au long de la journée. Les espaces de vie ont été pensés pour recevoir, avec une circulation fluide entre le séjour, la cuisine et la terrasse.\n\nL'espace nuit réunit quatre chambres, dont une suite avec vue sur le jardin. Les matériaux sobres, les rangements intégrés et la climatisation réversible assurent un confort durable au quotidien.\n\nÀ l'extérieur, la piscine, la terrasse et le jardin paysagé composent un cadre calme à proximité immédiate du centre de Gémenos. Un garage et deux places de stationnement complètent ce bien.",
    images,
  };
}
