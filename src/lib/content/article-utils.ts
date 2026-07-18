export function createArticleSlug(value: string) {
  const normalized = value
    .replace(/[²₂]/g, "2")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return normalized || "article";
}

export function estimateReadingMinutes(markdown: string) {
  const words = markdown
    .replace(/[#>*_`[\]().-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  return Math.max(1, Math.ceil(words.length / 220));
}

export function normalizeArticleExcerpt(value: string, fallbackMarkdown = "") {
  const cleanValue = value.trim().replace(/\s+/g, " ");

  if (cleanValue) {
    return cleanValue.slice(0, 280);
  }

  return fallbackMarkdown
    .replace(/[#>*_`[\]()-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);
}

export function formatArticleDate(value: string | null) {
  if (!value) {
    return "Non publié";
  }

  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(value));
}
