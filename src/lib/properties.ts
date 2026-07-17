import "server-only";

export type PropertyImage = { id: string; public_url: string; alt_text: string | null; position: number; is_cover: boolean };
export type Property = {
  id: string; slug: string; status: "draft" | "published" | "archived"; title: string; city_name: string;
  postal_code: string | null; neighborhood: string | null; property_type: string; transaction_type: string;
  price: number; surface_m2: number | null; rooms: number | null; bedrooms: number | null; floor_label: string | null;
  short_description: string | null; description: string | null; address: string | null; energy_rating: string | null;
  condominium_charges_monthly: number | null; property_tax_annual: number | null; condominium_lots: number | null;
  terrace_m2: number | null; heating: string | null; exposure: string | null; construction_year: number | null;
  parking_details: string | null; amenities: string[]; fees_paid_by: string | null; contact_name: string | null;
  contact_phone: string | null; contact_email: string | null; published_at: string | null; created_at: string; images: PropertyImage[];
};

function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const value = config();
  if (!value) throw new Error("Configuration Supabase absente.");
  const response = await fetch(`${value.url}/rest/v1/${path}`, { ...init, cache: "no-store", headers: { apikey: value.key, Authorization: `Bearer ${value.key}`, "Content-Type": "application/json", ...(init?.headers || {}) } });
  if (!response.ok) throw new Error(await response.text());
  return response.status === 204 ? (undefined as T) : response.json();
}

async function attachImages(rows: Omit<Property, "images">[]): Promise<Property[]> {
  if (!rows.length) return [];
  const ids = rows.map((row) => row.id).join(",");
  const images = await request<(PropertyImage & { property_id: string })[]>(`property_images?property_id=in.(${ids})&select=*&order=position.asc`);
  return rows.map((row) => ({ ...row, images: images.filter((image) => image.property_id === row.id) }));
}

export async function getPublishedProperty(slug: string) {
  const rows = await request<Omit<Property, "images">[]>(`properties?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=*&limit=1`);
  return (await attachImages(rows))[0] ?? null;
}

export async function getAdminProperties() {
  const rows = await request<Omit<Property, "images">[]>("properties?select=*&order=updated_at.desc");
  return attachImages(rows);
}

export function getSupabaseAdminConfig() { return config(); }
export async function adminRest<T>(path: string, init?: RequestInit) { return request<T>(path, init); }
