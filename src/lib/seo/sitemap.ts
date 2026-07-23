import type { MetadataRoute } from "next";

type SitemapEntry = MetadataRoute.Sitemap[number];

export const publicSitemapRoutes = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/prix-m2", changeFrequency: "weekly", priority: 0.9 },
  { path: "/biens", changeFrequency: "daily", priority: 0.9 },
  { path: "/estimation", changeFrequency: "monthly", priority: 0.9 },
  { path: "/estimation-immobiliere", changeFrequency: "weekly", priority: 0.8 },
  { path: "/agence-immobiliere", changeFrequency: "weekly", priority: 0.8 },
  { path: "/recherche", changeFrequency: "monthly", priority: 0.8 },
  { path: "/contenus", changeFrequency: "weekly", priority: 0.8 },
  { path: "/qui-sommes-nous", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.7 },
  { path: "/nous-rejoindre", changeFrequency: "monthly", priority: 0.7 },
  { path: "/parrainage", changeFrequency: "monthly", priority: 0.7 },
  { path: "/honoraires", changeFrequency: "monthly", priority: 0.5 },
  { path: "/mentions-legales", changeFrequency: "yearly", priority: 0.3 },
] as const satisfies ReadonlyArray<{
  changeFrequency: NonNullable<SitemapEntry["changeFrequency"]>;
  path: string;
  priority: number;
}>;

const excludedPrefixes = ["/admin", "/api", "/client"];
const excludedPaths = new Set(["/recherche-acheteurs", "/recherche/confirmation"]);

export function mergePublicSitemapEntries(...groups: MetadataRoute.Sitemap[]): MetadataRoute.Sitemap {
  const entries = new Map<string, SitemapEntry>();

  for (const entry of groups.flat()) {
    const url = canonicalizePublicSitemapUrl(entry.url);

    if (!url || entries.has(url)) {
      continue;
    }

    entries.set(url, { ...entry, url });
  }

  return [...entries.values()];
}

export function isPublicSitemapPath(pathname: string) {
  const normalizedPath = pathname !== "/" ? pathname.replace(/\/$/, "") : pathname;

  if (excludedPaths.has(normalizedPath)) {
    return false;
  }

  return !excludedPrefixes.some((prefix) => (
    normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)
  ));
}

function canonicalizePublicSitemapUrl(value: string) {
  try {
    const url = new URL(value);

    if (!isPublicSitemapPath(url.pathname)) {
      return null;
    }

    url.hash = "";
    url.search = "";
    return url.toString();
  } catch {
    return null;
  }
}
