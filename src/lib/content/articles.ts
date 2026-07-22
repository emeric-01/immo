import "server-only";

import type { AdminDataState } from "@/lib/admin/clients";
import { absoluteUrl } from "@/lib/site";
import { createArticleSlug, estimateReadingMinutes, normalizeArticleExcerpt } from "./article-utils";

export type ContentStatus = "draft" | "published" | "archived";

export type ContentArticle = {
  body_markdown: string;
  category: string;
  cover_image_alt: string | null;
  cover_image_url: string | null;
  created_at: string;
  created_by_admin_id: string | null;
  excerpt: string | null;
  id: string;
  primary_keyword: string | null;
  published_at: string | null;
  reading_minutes: number;
  related_city_slug: string | null;
  seo_description: string | null;
  seo_title: string | null;
  slug: string;
  status: ContentStatus;
  title: string;
  updated_at: string;
  updated_by_admin_id: string | null;
};

export type ArticleInput = {
  bodyMarkdown: string;
  category: string;
  coverImageAlt: string;
  coverImageUrl: string;
  excerpt: string;
  primaryKeyword: string;
  relatedCitySlug: string;
  seoDescription: string;
  seoTitle: string;
  slug: string;
  status: ContentStatus;
  title: string;
};

type Config = {
  key: string;
  url: string;
};

function getConfig(): Config | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  return url && key ? { key, url: url.replace(/\/$/, "") } : null;
}

export function isContentDatabaseConfigured() {
  return Boolean(getConfig());
}

export async function getAdminContentArticles(filters: { q?: string; status?: string } = {}): Promise<AdminDataState<ContentArticle[]>> {
  const config = getConfig();

  if (!config) {
    return missingConfig();
  }

  const params = new URLSearchParams({
    limit: "300",
    order: "updated_at.desc",
    select: "*",
  });

  if (filters.status && filters.status !== "all") {
    params.set("status", `eq.${filters.status}`);
  }

  const result = await fetchRest<ContentArticle[]>(config, `content_articles?${params.toString()}`);

  if (result.status !== "ready") {
    return result;
  }

  const query = filters.q?.trim().toLowerCase();

  if (!query) {
    return result;
  }

  return {
    data: result.data.filter((article) =>
      [
        article.title,
        article.slug,
        article.excerpt ?? "",
        article.primary_keyword ?? "",
        article.category,
      ].join(" ").toLowerCase().includes(query),
    ),
    status: "ready",
  };
}

export async function getAdminContentArticle(id: string): Promise<AdminDataState<ContentArticle | null>> {
  const config = getConfig();

  if (!config) {
    return missingConfig();
  }

  const params = new URLSearchParams({
    id: `eq.${id}`,
    limit: "1",
    select: "*",
  });
  const result = await fetchRest<ContentArticle[]>(config, `content_articles?${params.toString()}`);

  if (result.status !== "ready") {
    return result;
  }

  return { data: result.data[0] ?? null, status: "ready" };
}

export async function getPublishedContentArticles(limit = 50) {
  const config = getConfig();

  if (!config) {
    return [];
  }

  const params = new URLSearchParams({
    limit: String(limit),
    order: "published_at.desc",
    select: "*",
    status: "eq.published",
  });
  const result = await fetchRest<ContentArticle[]>(config, `content_articles?${params.toString()}`);

  return result.status === "ready" ? result.data : [];
}

export async function getPublishedContentArticle(slug: string) {
  const config = getConfig();

  if (!config) {
    return null;
  }

  const params = new URLSearchParams({
    limit: "1",
    select: "*",
    slug: `eq.${slug}`,
    status: "eq.published",
  });
  const result = await fetchRest<ContentArticle[]>(config, `content_articles?${params.toString()}`);

  return result.status === "ready" ? result.data[0] ?? null : null;
}

export async function getContentArticleSitemapEntries() {
  const articles = await getPublishedContentArticles(500);

  return articles.map((article) => ({
    changeFrequency: "monthly" as const,
    images: article.cover_image_url ? [article.cover_image_url] : undefined,
    lastModified: article.updated_at || article.published_at || article.created_at,
    priority: 0.65,
    url: absoluteUrl(`/contenus/${article.slug}`),
  }));
}

export async function createContentArticle(input: ArticleInput, adminId: string | null) {
  const config = requireConfig();
  const slug = await resolveUniqueSlug(config, input.slug || input.title);
  const now = new Date().toISOString();
  const body = { ...buildPayload(input, slug, now, adminId), created_by_admin_id: adminId };
  const result = await writeRest<ContentArticle[]>(config, "content_articles", {
    body: JSON.stringify(body),
    method: "POST",
  });

  return result[0];
}

export async function updateContentArticle(id: string, input: ArticleInput, adminId: string | null) {
  const config = requireConfig();
  const slug = await resolveUniqueSlug(config, input.slug || input.title, id);
  const now = new Date().toISOString();
  const existing = await getExistingArticle(config, id);
  const body = buildPayload(input, slug, now, adminId, existing?.published_at ?? null);
  const result = await writeRest<ContentArticle[]>(
    config,
    `content_articles?id=eq.${encodeURIComponent(id)}`,
    {
      body: JSON.stringify(body),
      method: "PATCH",
    },
  );

  return result[0];
}

export function parseArticleFormData(formData: FormData): ArticleInput {
  const status = String(formData.get("status") ?? "draft");

  return {
    bodyMarkdown: String(formData.get("bodyMarkdown") ?? ""),
    category: String(formData.get("category") ?? "conseils"),
    coverImageAlt: String(formData.get("coverImageAlt") ?? ""),
    coverImageUrl: String(formData.get("coverImageUrl") ?? ""),
    excerpt: String(formData.get("excerpt") ?? ""),
    primaryKeyword: String(formData.get("primaryKeyword") ?? ""),
    relatedCitySlug: String(formData.get("relatedCitySlug") ?? ""),
    seoDescription: String(formData.get("seoDescription") ?? ""),
    seoTitle: String(formData.get("seoTitle") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    status: status === "published" || status === "archived" ? status : "draft",
    title: String(formData.get("title") ?? ""),
  };
}

export function validateArticleInput(input: ArticleInput) {
  if (input.title.trim().length < 3) {
    return "Ajoutez un titre de contenu.";
  }

  if (input.bodyMarkdown.trim().length < 40) {
    return "Ajoutez un contenu d'au moins quelques lignes.";
  }

  return null;
}

function buildPayload(input: ArticleInput, slug: string, now: string, adminId: string | null, previousPublishedAt: string | null = null) {
  const bodyMarkdown = input.bodyMarkdown.trim();
  const excerpt = normalizeArticleExcerpt(input.excerpt, bodyMarkdown);

  return {
    body_markdown: bodyMarkdown,
    category: input.category.trim() || "conseils",
    cover_image_alt: nullable(input.coverImageAlt),
    cover_image_url: nullable(input.coverImageUrl),
    excerpt: excerpt || null,
    primary_keyword: nullable(input.primaryKeyword),
    published_at: input.status === "published" ? previousPublishedAt || now : null,
    reading_minutes: estimateReadingMinutes(bodyMarkdown),
    related_city_slug: nullable(input.relatedCitySlug),
    seo_description: nullable(input.seoDescription) ?? (excerpt || null),
    seo_title: nullable(input.seoTitle),
    slug,
    status: input.status,
    title: input.title.trim(),
    updated_at: now,
    updated_by_admin_id: adminId,
  };
}

async function getExistingArticle(config: Config, id: string) {
  const params = new URLSearchParams({
    id: `eq.${id}`,
    limit: "1",
    select: "id,published_at",
  });
  const result = await fetchRest<Pick<ContentArticle, "id" | "published_at">[]>(config, `content_articles?${params.toString()}`);

  if (result.status !== "ready") {
    throw new Error(result.message);
  }

  return result.data[0] ?? null;
}

async function resolveUniqueSlug(config: Config, value: string, excludedId?: string) {
  const baseSlug = createArticleSlug(value);

  for (let suffix = 0; suffix < 50; suffix += 1) {
    const candidate = suffix === 0 ? baseSlug : `${baseSlug}-${suffix + 1}`;
    const params = new URLSearchParams({
      limit: "1",
      select: "id",
      slug: `eq.${candidate}`,
    });
    const result = await fetchRest<{ id: string }[]>(config, `content_articles?${params.toString()}`);

    if (result.status !== "ready") {
      throw new Error(result.message);
    }

    const existing = result.data[0];

    if (!existing || existing.id === excludedId) {
      return candidate;
    }
  }

  throw new Error("Impossible de generer un slug unique.");
}

async function fetchRest<T>(config: Config, path: string): Promise<AdminDataState<T>> {
  try {
    const response = await fetch(`${config.url}/rest/v1/${path}`, {
      cache: "no-store",
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
      },
    });

    if (!response.ok) {
      return { message: `Lecture Supabase impossible (${response.status}) : ${await response.text()}`, status: "error" };
    }

    return { data: (await response.json()) as T, status: "ready" };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "Lecture Supabase impossible.", status: "error" };
  }
}

async function writeRest<T>(config: Config, path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()) as T;
}

function requireConfig() {
  const config = getConfig();

  if (!config) {
    throw new Error("Configuration Supabase absente pour gerer les contenus.");
  }

  return config;
}

function nullable(value: string) {
  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}

function missingConfig(): AdminDataState<never> {
  return { message: "Ajoutez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY pour gerer les contenus.", status: "missing_config" };
}
