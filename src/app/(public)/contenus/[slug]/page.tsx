import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MarkdownContent } from "@/components/content/MarkdownContent";
import { formatArticleDate } from "@/lib/content/article-utils";
import { getPublishedContentArticle } from "@/lib/content/articles";
import { absoluteUrl } from "@/lib/site";
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

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "article", locale: "fr_FR", siteName: "Les Jumelles Immo", title, description, url: path },
    robots: { index: true, follow: true },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ContentArticlePage({ params }: ContentArticlePageProps) {
  const article = await getPublishedContentArticle((await params).slug);

  if (!article) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    author: { "@type": "Organization", name: "Les Jumelles Immo" },
    dateModified: article.updated_at,
    datePublished: article.published_at,
    description: article.seo_description || article.excerpt,
    headline: article.seo_title || article.title,
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
          <section className={styles.articleBody}>
            <MarkdownContent className={styles.markdown} markdown={article.body_markdown} />
          </section>
        </article>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </div>
    </main>
  );
}
