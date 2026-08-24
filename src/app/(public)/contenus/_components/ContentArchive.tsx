import Link from "next/link";
import { ArrowRight, Folder, FolderOpen, LayoutGrid } from "lucide-react";
import { ContentImage } from "@/components/content/ContentImage";
import { formatArticleMonth } from "@/lib/content/article-utils";
import type { ContentArticle } from "@/lib/content/articles";
import {
  contentCategories,
  getContentCategoryLabel,
  normalizeContentCategory,
  type ContentCategorySlug,
} from "@/lib/content/categories";
import styles from "../contenus.module.css";

type ContentArchiveProps = {
  activeCategory?: ContentCategorySlug;
  allArticles: ContentArticle[];
  articles: ContentArticle[];
  heading: string;
};

export function ContentArchive({ activeCategory, allArticles, articles, heading }: ContentArchiveProps) {
  const categoryCounts = new Map<ContentCategorySlug, number>();
  allArticles.forEach((article) => {
    const category = normalizeContentCategory(article.category);
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
  });

  return <>
    <nav aria-label="Dossiers de contenus" className={styles.categoryNavigation}>
      <Link className={styles.allArticlesLink} data-active={!activeCategory || undefined} href="/contenus">
        <LayoutGrid aria-hidden="true" size={20} />
        <span><strong>Tous les articles</strong><small>{allArticles.length} publication{allArticles.length > 1 ? "s" : ""}</small></span>
      </Link>
      <div className={styles.categoryFolders}>
        {contentCategories.map((category) => {
          const active = activeCategory === category.slug;
          const count = categoryCounts.get(category.slug) ?? 0;
          return <Link className={styles.categoryFolder} data-active={active || undefined} href={`/contenus/categorie/${category.slug}`} key={category.slug}>
            {active ? <FolderOpen aria-hidden="true" size={24} /> : <Folder aria-hidden="true" size={24} />}
            <span><strong>{category.folderLabel}</strong><small>{count} article{count > 1 ? "s" : ""}</small></span>
          </Link>;
        })}
      </div>
    </nav>

    {articles.length === 0 ? (
      <section className={styles.empty}>
        <p>Aucun contenu publié dans ce dossier pour le moment.</p>
        <Link href="/contenus">Voir tous les articles</Link>
      </section>
    ) : (
      <section className={styles.indexSection} aria-labelledby="content-archive-title">
        <div className={styles.indexHeading}>
          <h2 id="content-archive-title">{heading}</h2>
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
                    sizes="(max-width: 760px) calc(100vw - 52px), (max-width: 1020px) 46vw, (max-width: 1199px) 370px, 280px"
                    src={article.cover_image_url}
                  />
                ) : (
                  <span className={styles.cardMediaFallback}>{getContentCategoryLabel(article.category)}</span>
                )}
              </div>
              <div className={styles.cardMeta}>
                <span>{getContentCategoryLabel(article.category)}</span>
                <span>·</span>
                <span>{formatArticleMonth(article.published_at)}</span>
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
  </>;
}
