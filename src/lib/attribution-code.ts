export const attributionCodePattern = /^[a-z0-9][a-z0-9-]{2,39}$/;

export function normalizeAttributionCode(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}

export function suggestAttributionCode(fullName: string) {
  const [firstName = ""] = fullName.trim().split(/\s+/);
  return normalizeAttributionCode(firstName);
}
