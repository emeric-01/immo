import { sitemapSections } from "@/lib/seo/sitemap-data";
import { serializeSitemapIndex, sitemapXmlResponse } from "@/lib/seo/sitemap-xml";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

export function GET() {
  return sitemapXmlResponse(serializeSitemapIndex(
    sitemapSections.map((section) => ({ url: absoluteUrl(section.path) })),
  ));
}
