import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { adminRest, getSupabaseAdminConfig, type PropertyImage } from "@/lib/properties";
import { EXCLUSIVE_MANDATE_AMENITY } from "@/lib/property-constants";
import { geocodePropertyAddress } from "@/lib/property-geocoding";

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const number = (form: FormData, key: string) => text(form, key) ? Number(text(form, key)) : null;
const propertyStatuses = new Set(["draft", "published", "sold", "archived"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  try {
    const { id } = await params;
    const form = await request.formData();
    const requestedStatus = text(form, "status");
    const status = propertyStatuses.has(requestedStatus) ? requestedStatus : "draft";
    const geocode = await geocodePropertyAddress(text(form, "address"), text(form, "postal_code"), text(form, "city_name"));
    const amenities = form.getAll("amenities").map(String);
    if (text(form, "mandate_type") === "exclusive") amenities.push(EXCLUSIVE_MANDATE_AMENITY);
    const payload = {
      title: text(form, "title"), city_name: text(form, "city_name"), status,
      postal_code: text(form, "postal_code") || null, neighborhood: text(form, "neighborhood") || null,
      property_type: text(form, "property_type") || "apartment", price: number(form, "price"),
      surface_m2: number(form, "surface_m2"), rooms: number(form, "rooms"), bedrooms: number(form, "bedrooms"),
      floor_label: text(form, "floor_label") || null, short_description: text(form, "short_description") || null,
      description: text(form, "description") || null, address: text(form, "address") || null,
      ...(geocode ? { latitude: geocode.latitude, longitude: geocode.longitude } : {}),
      energy_rating: text(form, "energy_rating") || null,
      condominium_charges_monthly: number(form, "condominium_charges_monthly"),
      property_tax_annual: number(form, "property_tax_annual"), condominium_lots: number(form, "condominium_lots"),
      terrace_m2: number(form, "terrace_m2"), heating: text(form, "heating") || null,
      exposure: text(form, "exposure") || null, construction_year: number(form, "construction_year"),
      parking_details: text(form, "parking_details") || null, land_area_m2: number(form, "land_area_m2"),
      bathrooms: number(form, "bathrooms"), levels: number(form, "levels"), parking_spaces: number(form, "parking_spaces"),
      property_condition: text(form, "property_condition") || null, kitchen_type: text(form, "kitchen_type") || null,
      land_is_buildable: form.has("land_is_buildable"), land_is_serviced: form.has("land_is_serviced"), amenities,
      fees_paid_by: text(form, "fees_paid_by") || "Vendeur", contact_name: text(form, "contact_name") || null,
      contact_phone: text(form, "contact_phone") || null, contact_email: text(form, "contact_email") || null,
      seo_title: text(form, "seo_title") || null, seo_description: text(form, "seo_description") || null,
      seo_noindex: form.has("seo_noindex"), published_at: ["published", "sold"].includes(status) ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };
    const [property] = await adminRest<{ slug: string }[]>(`properties?id=eq.${id}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(payload) });
    if (!property) return NextResponse.json({ error: "Bien introuvable" }, { status: 404 });

    const config = getSupabaseAdminConfig();
    const removals = form.getAll("remove_images").map(String);
    if (removals.length) {
      const rows = await adminRest<(PropertyImage & { storage_path: string | null })[]>(`property_images?id=in.(${removals.join(",")})&property_id=eq.${id}&select=*`);
      if (config) for (const row of rows) if (row.storage_path) await fetch(`${config.url}/storage/v1/object/property-images/${row.storage_path}`, { method: "DELETE", headers: { apikey: config.key, Authorization: `Bearer ${config.key}` } });
      await adminRest(`property_images?id=in.(${removals.join(",")})&property_id=eq.${id}`, { method: "DELETE" });
    }
    const requestedOrder = JSON.parse(text(form, "image_order") || "[]") as string[];
    if (requestedOrder.length) {
      await adminRest(`property_images?property_id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ is_cover: false }) });
      for (const [position, imageId] of requestedOrder.entries()) await adminRest(`property_images?id=eq.${imageId}&property_id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ position, is_cover: position === 0 }) });
    }
    const previous = await adminRest<PropertyImage[]>(`property_images?property_id=eq.${id}&select=*&order=position.desc&limit=1`);
    let position = (previous[0]?.position ?? -1) + 1;
    const files = form.getAll("photos").filter((value): value is File => value instanceof File && value.size > 0);
    if (config) for (const file of files) {
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${id}/${crypto.randomUUID()}.${ext}`;
      const upload = await fetch(`${config.url}/storage/v1/object/property-images/${path}`, { method: "POST", headers: { apikey: config.key, Authorization: `Bearer ${config.key}`, "Content-Type": file.type }, body: await file.arrayBuffer() });
      if (!upload.ok) throw new Error(await upload.text());
      await adminRest("property_images", { method: "POST", body: JSON.stringify({ property_id: id, storage_path: path, public_url: `${config.url}/storage/v1/object/public/property-images/${path}`, position, is_cover: position === 0 }) });
      position++;
    }
    return NextResponse.json({ slug: property.slug });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Modification impossible" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  try {
    const { id } = await params;
    const encodedId = encodeURIComponent(id);
    const images = await adminRest<Array<{ storage_path: string | null }>>(`property_images?property_id=eq.${encodedId}&select=storage_path`);
    const deleted = await adminRest<Array<{ id: string }>>(`properties?id=eq.${encodedId}`, {
      method: "DELETE",
      headers: { Prefer: "return=representation" },
    });
    if (!deleted.length) return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });

    const config = getSupabaseAdminConfig();
    if (config) {
      await Promise.allSettled(images.map(async ({ storage_path: storagePath }) => {
        if (!storagePath) return;
        await fetch(`${config.url}/storage/v1/object/property-images/${storagePath}`, {
          method: "DELETE",
          headers: { apikey: config.key, Authorization: `Bearer ${config.key}` },
        });
      }));
    }
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Suppression impossible" }, { status: 500 });
  }
}
