import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MarkdownContent } from "@/components/content/MarkdownContent";
import { getCityBySlug } from "@/lib/cities";
import { readCityMarketCache } from "@/lib/city-market-cache";
import { formatArticleDate } from "@/lib/content/article-utils";
import { getPublishedContentArticle } from "@/lib/content/articles";
import { absoluteUrl } from "@/lib/site";
import { CityMarketChart } from "../../prix-immobilier/[city]/city-market-chart";
import styles from "../contenus.module.css";

export const revalidate = 900;

type ContentArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ContentArticlePageProps): Promise<Metadata> {
  const article = await getPublishedContentArticle((await params).slug);

  if (!article) {
    return { title: "Contenu immobilier", robots: { index: false, follow: false } };
  }

  const title = article.seo_title || `${article.title} | Les Jumelles Immo`;
  const description = article.seo_description || article.excerpt || "Conseil immobilier local par Les Jumelles Immo.";
  const path = `/contenus/${article.slug}`;

  const images = article.cover_image_url ? [{ alt: article.cover_image_alt || article.title, url: article.cover_image_url }] : undefined;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "article", locale: "fr_FR", siteName: "Les Jumelles Immo", title, description, url: path, images },
    robots: { index: true, follow: true },
    twitter: { card: "summary_large_image", title, description, images: article.cover_image_url ? [article.cover_image_url] : undefined },
  };
}

export default async function ContentArticlePage({ params }: ContentArticlePageProps) {
  const article = await getPublishedContentArticle((await params).slug);

  if (!article) {
    notFound();
  }

  const relatedCity = article.related_city_slug ? getCityBySlug(article.related_city_slug) : null;
  const cityMarketCache = relatedCity ? await readCityMarketCache(relatedCity) : null;
  const cityMarket = cityMarketCache?.data;
  const averagePrice = cityMarket
    ? Math.round((cityMarket.apartment.averagePricePerM2 + cityMarket.house.averagePricePerM2) / 2)
    : null;
  const chartArticleParts = splitArticleForMarketChart(article.body_markdown);
  const showMarketChart = Boolean(
    chartArticleParts && relatedCity && cityMarket?.history.length && averagePrice,
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    author: { "@type": "Organization", name: "Les Jumelles Immo" },
    dateModified: article.updated_at,
    datePublished: article.published_at,
    description: article.seo_description || article.excerpt,
    headline: article.seo_title || article.title,
    image: article.cover_image_url || undefined,
    mainEntityOfPage: absoluteUrl(`/contenus/${article.slug}`),
    publisher: { "@type": "Organization", name: "Les Jumelles Immo" },
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Link className={styles.backLink} href="/contenus"><ArrowLeft size={18} /> Tous les contenus</Link>
        <article>
          <header className={styles.articleHero}>
            <p className={styles.eyebrow}>{article.category}</p>
            <h1>{article.title}</h1>
            <p>{article.excerpt}</p>
            <div className={styles.articleMeta}>
              <span>{formatArticleDate(article.published_at)}</span>
              <span>{article.reading_minutes} min de lecture</span>
              {article.primary_keyword ? <span>{article.primary_keyword}</span> : null}
            </div>
          </header>
          {article.cover_image_url ? (
            <div className={styles.articleCover}>
              <Image
                alt={article.cover_image_alt || article.title}
                fill
                priority
                quality={76}
                sizes="(max-width: 960px) calc(100vw - 40px), 920px"
                src={article.cover_image_url}
              />
            </div>
          ) : null}
          <section className={styles.articleBody}>
            <MarkdownContent
              className={styles.markdown}
              markdown={showMarketChart && chartArticleParts ? chartArticleParts.before : article.body_markdown}
            />
            {showMarketChart && chartArticleParts && relatedCity && cityMarket && averagePrice ? (
              <div className={styles.articleMarketChart} aria-labelledby="article-market-chart-title">
                <div className={styles.articleMarketChartHeading}>
                  <div>
                    <p className={styles.eyebrow}>Transactions immobilières</p>
                    <h2 id="article-market-chart-title">Évolution des prix à {relatedCity.name}</h2>
                  </div>
                  <div className={styles.articleChartLegend} aria-label="Légende">
                    <span data-property="apartment">Appartement</span>
                    <span data-property="house">Maison</span>
                  </div>
                </div>
                <CityMarketChart
                  averagePrice={averagePrice}
                  cityName={relatedCity.name}
                  defaultPeriod="5y"
                  points={cityMarket.history}
                />
                <p className={styles.articleChartSource}>
                  Repères construits à partir des transactions DVF publiées par la DGFiP, agrégées par type de bien.
                  Les prix constatés ne remplacent pas l’estimation des caractéristiques propres au logement.
                </p>
              </div>
            ) : null}
            {showMarketChart && chartArticleParts ? (
              <MarkdownContent className={styles.markdown} markdown={chartArticleParts.after} />
            ) : null}
          </section>
        </article>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </div>
    </main>
  );
}

function splitArticleForMarketChart(markdown: string) {
  const anchor = "Le graphique présenté ci-dessus";
  const position = markdown.indexOf(anchor);

  if (position < 0) {
    return null;
  }

  return {
    after: markdown.slice(position).trimStart(),
    before: markdown.slice(0, position).trimEnd(),
  };
}
