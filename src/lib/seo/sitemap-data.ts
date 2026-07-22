import "server-only";

import type { MetadataRoute } from "next";
import { readCityMarketCacheDates } from "@/lib/city-market-cache";
import { southCities } from "@/lib/cities";
import { getContentArticleSitemapEntries } from "@/lib/content/articles";
import { getPublishedProperties } from "@/lib/properties";
import { absoluteUrl } from "@/lib/site";
import { mergePublicSitemapEntries, publicSitemapRoutes } from "./sitemap";

export const sitemapSections = [
  { id: "pages", label: "Pages principales", path: "/sitemaps/pages.xml" },
  { id: "prix-m2", label: "Prix au m2 par ville", path: "/sitemaps/prix-m2.xml" },
  { id: "estimations", label: "Estimations immobilieres", path: "/sitemaps/estimations.xml" },
  { id: "agences", label: "Agences immobilieres locales", path: "/sitemaps/agences.xml" },
  { id: "contenus", label: "Articles et contenus", path: "/sitemaps/contenus.xml" },
  { id: "biens", label: "Biens immobiliers", path: "/sitemaps/biens.xml" },
] as const;

export type SitemapSection = (typeof sitemapSections)[number]["id"];

const localCities = southCities.filter((city) =>
  ["Bouches-du-Rhone", "Var"].includes(city.department),
);

export async function getSitemapSectionEntries(section: SitemapSection): Promise<MetadataRoute.Sitemap> {
  if (section === "pages") {
    return mergePublicSitemapEntries(publicSitemapRoutes.map((route) => ({
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      url: absoluteUrl(route.path),
    })));
  }

  if (section === "contenus") {
    return mergePublicSitemapEntries(
      await getContentArticleSitemapEntries().catch(() => []),
    );
  }

  if (section === "biens") {
    const properties = await getPublishedProperties().catch(() => []);

    return mergePublicSitemapEntries(properties
      .filter((property) => !property.seo_noindex)
      .map((property) => ({
        changeFrequency: "weekly" as const,
        images: property.images.map((image) => image.public_url).filter(Boolean),
        lastModified: property.updated_at || property.published_at || property.created_at,
        priority: 0.8,
        url: absoluteUrl(`/biens/${property.slug}`),
      })));
  }

  const cityMarketDates = await readCityMarketCacheDates(southCities);

  if (section === "prix-m2") {
    return mergePublicSitemapEntries(southCities.map((city) => ({
      changeFrequency: "weekly" as const,
      lastModified: cityMarketDates.get(city.inseeCode),
      priority: 0.8,
      url: absoluteUrl(`/prix-m2/${city.slug}`),
    })));
  }

  const prefix = section === "estimations" ? "estimation-immobiliere" : "agence-immobiliere";

  return mergePublicSitemapEntries(localCities.map((city) => ({
    changeFrequency: "weekly" as const,
    lastModified: cityMarketDates.get(city.inseeCode),
    priority: 0.9,
    url: absoluteUrl(`/${prefix}/${city.slug}`),
  })));
}
