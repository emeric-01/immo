import type { MetadataRoute } from "next";
import { southCities } from "@/lib/cities";
import { getPublishedProperties } from "@/lib/properties";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/prix-m2"), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/estimation"), changeFrequency: "monthly", priority: 0.9 },
    { url: absoluteUrl("/recherche"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/qui-sommes-nous"), changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/nous-rejoindre"), changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/honoraires"), changeFrequency: "monthly", priority: 0.5 },
  ];

  const cityPages: MetadataRoute.Sitemap = southCities.map(city => ({
    url: absoluteUrl(`/prix-m2/${city.slug}`),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const properties = await getPublishedProperties().catch(() => []);
  const propertyPages: MetadataRoute.Sitemap = properties.filter(property => !property.seo_noindex).map(property => ({
    url: absoluteUrl(`/biens/${property.slug}`),
    lastModified: property.updated_at || property.published_at || property.created_at,
    changeFrequency: "weekly",
    priority: 0.8,
    images: property.images.map(image => image.public_url),
  }));

  return [...staticPages, ...cityPages, ...propertyPages];
}
