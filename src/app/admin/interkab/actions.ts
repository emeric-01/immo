"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin/auth";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { INTERKAB_CITIES, seedInterkabCities, syncInterkabCity } from "@/lib/interkab";

export async function syncInterkabCityAction(formData: FormData) {
  const session = await requireAdminSession();
  await requireAdminPermission(session, "properties:read");
  const inseeCode = String(formData.get("inseeCode") ?? "");
  const city = INTERKAB_CITIES.find((candidate) => candidate.inseeCode === inseeCode);
  if (!city) throw new Error("Ville Interkab inconnue.");
  await seedInterkabCities();
  await syncInterkabCity(city, city.slug === "aubagne" ? 6 : 3);
  revalidatePath("/admin/interkab");
}
