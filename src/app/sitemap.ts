import type { MetadataRoute } from "next";
import { southCities } from "@/lib/cities";
import { getContentArticleSitemapEntries } from "@/lib/content/articles";
import { getPublishedProperties } from "@/lib/properties";
import { mergePublicSitemapEntries, publicSitemapRoutes } from "@/lib/seo/sitemap";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = publicSitemapRoutes.map((route) => ({
    changeFrequency: route.changeFrequency,
    priority: route.priority,
    url: absoluteUrl(route.path),
  }));

  const cityPages: MetadataRoute.Sitemap = southCities.map(city => ({
    url: absoluteUrl(`/prix-m2/${city.slug}`),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const localCities = southCities.filter((city) =>
    ["Bouches-du-Rhone", "Var"].includes(city.department),
  );
  const localServicePages: MetadataRoute.Sitemap = localCities.flatMap((city) => [
    {
      url: absoluteUrl(`/estimation-immobiliere/${city.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: absoluteUrl(`/agence-immobiliere/${city.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
  ]);

  const properties = await getPublishedProperties().catch(() => []);
  const contentPages = await getContentArticleSitemapEntries().catch(() => []);
  const propertyPages: MetadataRoute.Sitemap = properties
    .filter((property) => !property.seo_noindex)
    .map((property) => ({
      changeFrequency: "weekly",
      images: property.images.map((image) => image.public_url).filter(Boolean),
      lastModified: property.updated_at || property.published_at || property.created_at,
      priority: 0.8,
      url: absoluteUrl(`/biens/${property.slug}`),
    }));

  return mergePublicSitemapEntries(
    staticPages,
    cityPages,
    localServicePages,
    contentPages,
    propertyPages,
  );
}
