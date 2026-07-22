import { getSitemapSectionEntries } from "@/lib/seo/sitemap-data";
import { serializeSitemap, sitemapXmlResponse } from "@/lib/seo/sitemap-xml";

export const revalidate = 3600;

export async function GET() {
  return sitemapXmlResponse(serializeSitemap(await getSitemapSectionEntries("prix-m2")));
}
