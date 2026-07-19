import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ContentImage } from "@/components/content/ContentImage";
import { formatArticleDate } from "@/lib/content/article-utils";
import { getPublishedContentArticles } from "@/lib/content/articles";
import { createPageMetadata } from "@/lib/seo";
import styles from "./contenus.module.css";

export const revalidate = 900;

export const metadata: Metadata = createPageMetadata({
  title: "Conseils immobilier, data et marché local | Les Jumelles Immo",
  description: "Articles, analyses et conseils immobiliers pour comprendre les prix au m², vendre au meilleur prix et valoriser un bien dans le 13 et le 83.",
  path: "/contenus",
});

export default async function ContentIndexPage() {
  const articles = await getPublishedContentArticles();

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Observatoire immobilier local</p>
          <h1>Conseils, prix au m² et idées pour mieux vendre.</h1>
          <p>Des contenus pensés pour relier la donnée, l’urbanisme, l’architecture intérieure et la vraie vie d’un projet immobilier.</p>
        </section>

        {articles.length === 0 ? (
          <section className={styles.empty}>
            <p>Aucun contenu publié pour le moment. Les premiers articles arrivent bientôt.</p>
          </section>
        ) : (
          <section className={styles.indexSection} aria-labelledby="latest-content-title">
            <div className={styles.indexHeading}>
              <h2 id="latest-content-title">Dernières publications</h2>
              <span>{articles.length} article{articles.length > 1 ? "s" : ""}</span>
            </div>
            <div className={styles.grid}>
              {articles.map((article) => (
                <Link key={article.id} className={styles.card} href={`/contenus/${article.slug}`}>
                  <div className={styles.cardMedia}>
                    {article.cover_image_url ? (
                      <ContentImage
                        alt={article.cover_image_alt || article.title}
                        fill
                        sizes="(max-width: 760px) calc(100vw - 52px), (max-width: 1020px) 46vw, 370px"
                        src={article.cover_image_url}
                      />
                    ) : (
                      <span className={styles.cardMediaFallback}>{article.category}</span>
                    )}
                  </div>
                  <div className={styles.cardMeta}>
                    <span>{article.category}</span>
                    <span>·</span>
                    <span>{formatArticleDate(article.published_at)}</span>
                  </div>
                  <h2>{article.title}</h2>
                  {article.excerpt ? <p>{article.excerpt}</p> : null}
                  <div className={styles.cardFooter}>
                    <span>{article.reading_minutes} min de lecture</span>
                    <span className={styles.cardArrow} aria-hidden="true"><ArrowRight size={17} /></span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
