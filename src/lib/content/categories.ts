export const contentCategories = [
  {
    description: "Recherche, financement, visites et vérifications avant de s’engager.",
    label: "Acheter",
    metaDescription: "Conseils pour rechercher, visiter et acheter un bien immobilier avec méthode dans les Bouches-du-Rhône et le Var.",
    pageTitle: "Acheter un bien immobilier",
    slug: "acheter",
  },
  {
    description: "Préparation, valorisation, mandat et étapes d’une vente réussie.",
    label: "Vendre",
    metaDescription: "Conseils pour préparer, valoriser et vendre un bien immobilier dans les meilleures conditions.",
    pageTitle: "Vendre un bien immobilier",
    slug: "vendre",
  },
  {
    description: "Méthodes, critères de valeur et particularités de chaque bien.",
    label: "Estimer",
    metaDescription: "Comprendre les méthodes d’estimation immobilière et les critères qui font varier la valeur d’une maison ou d’un appartement.",
    pageTitle: "Estimer la valeur d’un bien",
    slug: "estimer",
  },
  {
    description: "Prix au m², transactions DVF et analyses des communes et quartiers.",
    label: "Marché immobilier local",
    metaDescription: "Analyses du marché immobilier local, prix au m² et tendances dans les Bouches-du-Rhône et le Var.",
    pageTitle: "Comprendre le marché immobilier local",
    slug: "marche-immobilier-local",
  },
  {
    description: "Urbanisme, réglementation, travaux et décisions patrimoniales.",
    label: "Conseils immobiliers",
    metaDescription: "Guides pratiques sur l’urbanisme, les travaux, la réglementation et les décisions liées à un projet immobilier.",
    pageTitle: "Conseils immobiliers pratiques",
    slug: "conseils-immobiliers",
  },
] as const;

export type ContentCategorySlug = (typeof contentCategories)[number]["slug"];

export const defaultContentCategory: ContentCategorySlug = "conseils-immobiliers";

const legacyCategoryAliases: Record<string, ContentCategorySlug> = {
  achat: "acheter",
  "achat-local": "acheter",
  acheter: "acheter",
  conseil: "conseils-immobiliers",
  conseils: "conseils-immobiliers",
  "conseils-immobiliers": "conseils-immobiliers",
  data: "marche-immobilier-local",
  estimation: "estimer",
  estimer: "estimer",
  "marche-immobilier-local": "marche-immobilier-local",
  "marche-local": "marche-immobilier-local",
  "prix-m2": "marche-immobilier-local",
  urbanisme: "conseils-immobiliers",
  valorisation: "vendre",
  vendre: "vendre",
  vente: "vendre",
};

function normalizeKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getContentCategory(value: string | null | undefined) {
  const slug = legacyCategoryAliases[normalizeKey(value ?? "")] ?? null;
  return contentCategories.find((category) => category.slug === slug) ?? null;
}

export function normalizeContentCategory(value: string | null | undefined): ContentCategorySlug {
  return getContentCategory(value)?.slug ?? defaultContentCategory;
}

export function getContentCategoryLabel(value: string | null | undefined) {
  return getContentCategory(value)?.label ?? "Conseils immobiliers";
}
