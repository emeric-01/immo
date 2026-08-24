import type { Metadata } from "next";
import { getPublishedContentArticles } from "@/lib/content/articles";
import { createPageMetadata } from "@/lib/seo";
import { ContentArchive } from "./_components/ContentArchive";
import styles from "./contenus.module.css";

export const revalidate = 900;

export const metadata: Metadata = createPageMetadata({
  title: "Conseils immobiliers, achat, vente et estimation | Les Jumelles Immo",
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
          <h1>Tous nos conseils pour acheter, estimer et vendre.</h1>
          <p>Consultez toutes les publications ou ouvrez directement le dossier qui correspond à votre projet immobilier.</p>
        </section>

        <ContentArchive allArticles={articles} articles={articles} heading="Dernières publications" />
      </div>
    </main>
  );
}
