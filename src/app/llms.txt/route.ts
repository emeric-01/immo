import { getPublishedContentArticles } from "@/lib/content/articles";
import { getPublishedProperties } from "@/lib/properties";
import { buildLlmsText } from "@/lib/seo/llms";

export const revalidate = 3600;

export async function GET() {
  const [articles, properties] = await Promise.all([
    getPublishedContentArticles(500).catch(() => []),
    getPublishedProperties().catch(() => []),
  ]);

  return new Response(buildLlmsText({ articles, properties }), {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
