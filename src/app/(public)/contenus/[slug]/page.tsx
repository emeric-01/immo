import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import { MarkdownContent } from "@/components/content/MarkdownContent";
import { getCityBySlug, southCities, type City } from "@/lib/cities";
import { readCityMarketCache } from "@/lib/city-market-cache";
import { formatArticleDate } from "@/lib/content/article-utils";
import {
  getPublishedContentArticle,
  getPublishedContentArticles,
  type ContentArticle,
} from "@/lib/content/articles";
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

  const relatedCity = article.related_city_slug
    ? getCityBySlug(article.related_city_slug)
    : detectArticleCity(article);
  const publishedArticles = await getPublishedContentArticles(30);
  const suggestedArticles = selectSuggestedArticles(article, publishedArticles, relatedCity);
  const suggestedCities = relatedCity ? selectSuggestedCities(relatedCity) : [];
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

          {suggestedCities.length > 0 || suggestedArticles.length > 0 ? (
            <footer className={styles.articleDiscoveries}>
              {suggestedCities.length > 0 && relatedCity ? (
                <section className={styles.discoverySection} aria-labelledby="nearby-city-prices-title">
                  <div className={styles.discoveryHeading}>
                    <div>
                      <p className={styles.eyebrow}>Observatoire local</p>
                      <h2 id="nearby-city-prices-title">Les prix au m² autour de {relatedCity.name}</h2>
                    </div>
                    <Link className={styles.discoveryAllLink} href="/prix-m2">
                      Toutes les villes <ArrowRight size={17} />
                    </Link>
                  </div>
                  <div className={styles.citySuggestionGrid}>
                    {suggestedCities.map((city, index) => (
                      <Link
                        className={styles.citySuggestionCard}
                        data-featured={index === 0 ? "true" : undefined}
                        href={`/prix-m2/${city.slug}`}
                        key={city.slug}
                        title={`Prix m² à ${city.name}`}
                      >
                        <span className={styles.citySuggestionMeta}>
                          <MapPin size={15} /> {city.postalCode}
                        </span>
                        <strong>Prix m² à {city.name}</strong>
                        <span className={styles.citySuggestionCta}>
                          Voir les prix <ArrowRight size={16} />
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}

              {suggestedArticles.length > 0 ? (
                <section className={styles.discoverySection} aria-labelledby="related-articles-title">
                  <div className={styles.discoveryHeading}>
                    <div>
                      <p className={styles.eyebrow}>À lire ensuite</p>
                      <h2 id="related-articles-title">D’autres regards sur l’immobilier</h2>
                    </div>
                    <Link className={styles.discoveryAllLink} href="/contenus">
                      Tous les contenus <ArrowRight size={17} />
                    </Link>
                  </div>
                  <div className={styles.relatedArticleGrid}>
                    {suggestedArticles.map((suggestedArticle) => (
                      <Link
                        className={styles.relatedArticleCard}
                        href={`/contenus/${suggestedArticle.slug}`}
                        key={suggestedArticle.id}
                      >
                        {suggestedArticle.cover_image_url ? (
                          <div className={styles.relatedArticleMedia}>
                            <Image
                              alt={suggestedArticle.cover_image_alt || suggestedArticle.title}
                              fill
                              quality={72}
                              sizes="(max-width: 760px) calc(100vw - 48px), 360px"
                              src={suggestedArticle.cover_image_url}
                            />
                          </div>
                        ) : (
                          <div className={styles.relatedArticleFallback}>{suggestedArticle.category}</div>
                        )}
                        <div className={styles.relatedArticleContent}>
                          <span>{suggestedArticle.category} · {suggestedArticle.reading_minutes} min</span>
                          <h3>{suggestedArticle.title}</h3>
                          <div>Lire l’article <ArrowRight size={16} /></div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}
            </footer>
          ) : null}
        </article>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </div>
    </main>
  );
}

function detectArticleCity(article: ContentArticle) {
  const searchableText = normalizeForCityMatch([
    article.title,
    article.excerpt ?? "",
    article.primary_keyword ?? "",
  ].join(" "));

  return [...southCities]
    .filter((city) => city.postalCode.startsWith("13") || city.postalCode.startsWith("83"))
    .sort((left, right) => right.name.length - left.name.length)
    .find((city) => searchableText.includes(normalizeForCityMatch(city.name)));
}

function selectSuggestedCities(anchorCity: City) {
  const departmentCode = anchorCity.postalCode.slice(0, 2);

  if (departmentCode !== "13" && departmentCode !== "83") {
    return [];
  }

  const nearbyCities = anchorCity.nearbySlugs
    .map((slug) => getCityBySlug(slug))
    .filter((city): city is City => city !== undefined && city.postalCode.startsWith(departmentCode));
  const remainingDepartmentCities = southCities
    .filter((city) => city.slug !== anchorCity.slug && city.postalCode.startsWith(departmentCode))
    .sort((left, right) => cityDistance(anchorCity, left) - cityDistance(anchorCity, right));
  const uniqueCities = new Map<string, City>();

  [anchorCity, ...nearbyCities, ...remainingDepartmentCities].forEach((city) => {
    uniqueCities.set(city.slug, city);
  });

  return [...uniqueCities.values()].slice(0, 4);
}

function selectSuggestedArticles(
  currentArticle: ContentArticle,
  articles: ContentArticle[],
  relatedCity?: City | null,
) {
  return articles
    .filter((article) => article.id !== currentArticle.id)
    .map((article) => ({
      article,
      score:
        (article.related_city_slug && article.related_city_slug === relatedCity?.slug ? 8 : 0) +
        (article.category === currentArticle.category ? 4 : 0) +
        (isArticleInDepartment(article, relatedCity) ? 2 : 0),
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return getArticleTimestamp(right.article) - getArticleTimestamp(left.article);
    })
    .slice(0, 3)
    .map(({ article }) => article);
}

function isArticleInDepartment(article: ContentArticle, relatedCity?: City | null) {
  if (!relatedCity || !article.related_city_slug) {
    return false;
  }

  const articleCity = getCityBySlug(article.related_city_slug);
  return articleCity?.postalCode.slice(0, 2) === relatedCity.postalCode.slice(0, 2);
}

function cityDistance(origin: City, destination: City) {
  return Math.hypot(origin.latitude - destination.latitude, origin.longitude - destination.longitude);
}

function getArticleTimestamp(article: ContentArticle) {
  return new Date(article.published_at || article.updated_at).getTime();
}

function normalizeForCityMatch(value: string) {
  return ` ${value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()} `;
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
