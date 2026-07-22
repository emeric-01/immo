import type { MetadataRoute } from "next";

type SitemapEntry = MetadataRoute.Sitemap[number];

type SitemapIndexEntry = {
  lastModified?: Date | string;
  url: string;
};

const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
const stylesheet = '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>';

export function serializeSitemap(entries: MetadataRoute.Sitemap) {
  const rows = entries.map((entry) => [
    "  <url>",
    `    <loc>${escapeXml(entry.url)}</loc>`,
    serializeLastModified(entry.lastModified, "    "),
    entry.changeFrequency ? `    <changefreq>${entry.changeFrequency}</changefreq>` : "",
    typeof entry.priority === "number" ? `    <priority>${entry.priority}</priority>` : "",
    ...serializeImages(entry),
    "  </url>",
  ].filter(Boolean).join("\n"));

  return [
    xmlHeader,
    stylesheet,
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ...rows,
    "</urlset>",
    "",
  ].join("\n");
}

export function serializeSitemapIndex(entries: SitemapIndexEntry[]) {
  const rows = entries.map((entry) => [
    "  <sitemap>",
    `    <loc>${escapeXml(entry.url)}</loc>`,
    serializeLastModified(entry.lastModified, "    "),
    "  </sitemap>",
  ].filter(Boolean).join("\n"));

  return [
    xmlHeader,
    stylesheet,
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...rows,
    "</sitemapindex>",
    "",
  ].join("\n");
}

export function sitemapXmlResponse(xml: string) {
  return new Response(xml, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function serializeImages(entry: SitemapEntry) {
  return (entry.images ?? []).map((image) => [
    "    <image:image>",
    `      <image:loc>${escapeXml(image)}</image:loc>`,
    "    </image:image>",
  ].join("\n"));
}

function serializeLastModified(value: Date | string | undefined, indentation: string) {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return `${indentation}<lastmod>${date.toISOString()}</lastmod>`;
}
