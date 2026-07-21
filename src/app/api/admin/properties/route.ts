import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { adminRest, getSupabaseAdminConfig } from "@/lib/properties";
import { EXCLUSIVE_MANDATE_AMENITY } from "@/lib/property-constants";
import { geocodePropertyAddress } from "@/lib/property-geocoding";

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const number = (form: FormData, key: string) => { const value = text(form, key); return value ? Number(value) : null; };
const slugify = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const propertyStatuses = new Set(["draft", "published", "sold", "archived"]);

export async function POST(request: Request) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  try {
    const form = await request.formData();
    const title = text(form, "title"); const city = text(form, "city_name");
    const requestedStatus = text(form, "status");
    const status = propertyStatuses.has(requestedStatus) ? requestedStatus : "draft";
    if (!title || !city || !number(form, "price")) return NextResponse.json({ error: "Titre, ville et prix sont requis." }, { status: 400 });
    const geocode = await geocodePropertyAddress(text(form, "address"), text(form, "postal_code"), city);
    const amenities = form.getAll("amenities").map(String);
    if ((number(form, "terrace_m2") ?? 0) > 0 && !amenities.includes("Terrasse")) amenities.push("Terrasse");
    if (((number(form, "parking_spaces") ?? 0) > 0 || (text(form, "parking_details") && text(form, "parking_details") !== "Aucun")) && !amenities.includes("Parking")) amenities.push("Parking");
    if (text(form, "mandate_type") === "exclusive") amenities.push(EXCLUSIVE_MANDATE_AMENITY);
    const payload = {
      title, city_name: city, slug: `${slugify(title)}-${slugify(city)}-${Date.now().toString().slice(-6)}`,
      status, postal_code: text(form, "postal_code") || null, insee_code: text(form, "insee_code") || null,
      neighborhood: text(form, "neighborhood") || null, property_type: text(form, "property_type") || "apartment",
      transaction_type: text(form, "transaction_type") || "sale", price: number(form, "price"), surface_m2: number(form, "surface_m2"),
      rooms: number(form, "rooms"), bedrooms: number(form, "bedrooms"), floor_label: text(form, "floor_label") || null,
      short_description: text(form, "short_description") || null, description: text(form, "description") || null,
      address: text(form, "address") || null, latitude: geocode?.latitude ?? null, longitude: geocode?.longitude ?? null, energy_rating: text(form, "energy_rating") || null,
      condominium_charges_monthly: number(form, "condominium_charges_monthly"), property_tax_annual: number(form, "property_tax_annual"),
      condominium_lots: number(form, "condominium_lots"), terrace_m2: number(form, "terrace_m2"), heating: text(form, "heating") || null,
      exposure: text(form, "exposure") || null, construction_year: number(form, "construction_year"), parking_details: text(form, "parking_details") || null,
      land_area_m2: number(form, "land_area_m2"), bathrooms: number(form, "bathrooms"), levels: number(form, "levels"),
      parking_spaces: number(form, "parking_spaces"), property_condition: text(form, "property_condition") || null,
      kitchen_type: text(form, "kitchen_type") || null, land_is_buildable: form.has("land_is_buildable"), land_is_serviced: form.has("land_is_serviced"),
      amenities, fees_paid_by: text(form, "fees_paid_by") || "Vendeur",
      contact_name: text(form, "contact_name") || "Les Jumelles Immo", contact_phone: text(form, "contact_phone") || null,
      contact_email: text(form, "contact_email") || null, published_at: ["published", "sold"].includes(status) ? new Date().toISOString() : null,
      seo_title: text(form, "seo_title") || null, seo_description: text(form, "seo_description") || null, seo_noindex: form.has("seo_noindex"),
    };
    const [property] = await adminRest<{ id: string; slug: string }[]>("properties", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(payload) });
    const config = getSupabaseAdminConfig(); const files = form.getAll("photos").filter((item): item is File => item instanceof File && item.size > 0);
    if (config) for (const [position, file] of files.entries()) {
      if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) continue;
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const storagePath = `${property.id}/${crypto.randomUUID()}.${ext}`;
      const uploaded = await fetch(`${config.url}/storage/v1/object/property-images/${storagePath}`, { method: "POST", headers: { apikey: config.key, Authorization: `Bearer ${config.key}`, "Content-Type": file.type, "x-upsert": "false" }, body: await file.arrayBuffer() });
      if (!uploaded.ok) throw new Error(await uploaded.text());
      await adminRest("property_images", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ property_id: property.id, storage_path: storagePath, public_url: `${config.url}/storage/v1/object/public/property-images/${storagePath}`, alt_text: `${title} — photo ${position + 1}`, position, is_cover: position === 0 }) });
    }
    return NextResponse.json({ id: property.id, slug: property.slug });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Création impossible." }, { status: 500 }); }
}
