import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedContentArticles } from "@/lib/content/articles";
import { contentCategories, getContentCategory, normalizeContentCategory } from "@/lib/content/categories";
import { createPageMetadata } from "@/lib/seo";
import { ContentArchive } from "../../_components/ContentArchive";
import styles from "../../contenus.module.css";

export const revalidate = 900;

type ContentCategoryPageProps = {
  params: Promise<{ category: string }>;
};

export function generateStaticParams() {
  return contentCategories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }: ContentCategoryPageProps): Promise<Metadata> {
  const category = getContentCategory((await params).category);
  if (!category) return { title: "Dossier immobilier", robots: { follow: false, index: false } };
  return createPageMetadata({
    description: category.metaDescription,
    path: `/contenus/categorie/${category.slug}`,
    title: `${category.pageTitle} | Les Jumelles Immo`,
  });
}

export default async function ContentCategoryPage({ params }: ContentCategoryPageProps) {
  const category = getContentCategory((await params).category);
  if (!category) notFound();

  const allArticles = await getPublishedContentArticles(500);
  const articles = allArticles.filter((article) => normalizeContentCategory(article.category) === category.slug);

  return <main className={styles.page}>
    <div className={styles.shell}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Dossier · {category.label}</p>
        <h1>{category.pageTitle}</h1>
        <p>{category.description}</p>
      </section>
      <ContentArchive activeCategory={category.slug} allArticles={allArticles} articles={articles} heading={`Articles du dossier ${category.label}`} />
    </div>
  </main>;
}
