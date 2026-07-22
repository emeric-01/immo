import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenText, FilePenLine, FileText, Plus, Search } from "lucide-react";
import { requireAdminSession } from "@/lib/admin/auth";
import { hasAdminPermission } from "@/lib/admin/permissions";
import { formatArticleDate } from "@/lib/content/article-utils";
import { getAdminContentArticles } from "@/lib/content/articles";
import admin from "../admin.module.css";

export const metadata: Metadata = {
  title: "Contenus | Admin Les Jumelles Immo",
};

export const dynamic = "force-dynamic";

const statusLabels = {
  archived: "Archivé",
  draft: "Brouillon",
  published: "Publié",
};

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; q?: string; status?: string }>;
}) {
  const session = await requireAdminSession();
  const canRead = await hasAdminPermission(session, "contents:read");
  const canWrite = await hasAdminPermission(session, "contents:write");
  const params = await searchParams;

  if (!canRead) {
    return (
      <main className={admin.adminPage}>
        <AdminContentSidebar />
        <section className={admin.content}>
          <div className={admin.emptyState}>
            <FileText size={34} />
            <h1>Accès contenu indisponible</h1>
            <p>Votre rôle admin ne permet pas de consulter les contenus éditoriaux.</p>
          </div>
        </section>
      </main>
    );
  }

  const articles = await getAdminContentArticles({ q: params.q, status: params.status });
  const data = articles.status === "ready" ? articles.data : [];
  const published = data.filter((article) => article.status === "published").length;
  const drafts = data.filter((article) => article.status === "draft").length;

  return (
    <main className={admin.adminPage}>
      <AdminContentSidebar />
      <section className={admin.content}>
        <header className={admin.pageHeader}>
          <div>
            <p className={admin.eyebrow}>CMS maison</p>
            <h1>Contenus</h1>
            <p>Créez des pages éditoriales publiques sous /contenus/ pour travailler le SEO local et remplacer progressivement le blog WordPress.</p>
          </div>
          {canWrite ? <Link className={admin.primaryButton} href="/admin/contenus/nouveau"><Plus size={18} /> Nouveau contenu</Link> : null}
        </header>

        {params.error ? <p className={admin.errorText}>{params.error}</p> : null}

        <div className={admin.statsGrid}>
          <article className={admin.statCard}><span><BookOpenText size={18} /></span><p>Total</p><strong>{data.length}</strong></article>
          <article className={admin.statCard}><span><FileText size={18} /></span><p>Publiés</p><strong>{published}</strong></article>
          <article className={admin.statCard}><span><FilePenLine size={18} /></span><p>Brouillons</p><strong>{drafts}</strong></article>
        </div>

        <form className={admin.filterBar} action="/admin/contenus">
          <label className={admin.searchField}>
            <Search size={18} />
            <input name="q" defaultValue={params.q ?? ""} placeholder="Rechercher titre, slug, mot-clé..." />
          </label>
          <select name="status" defaultValue={params.status ?? "all"}>
            <option value="all">Tous</option>
            <option value="draft">Brouillons</option>
            <option value="published">Publiés</option>
            <option value="archived">Archivés</option>
          </select>
          <button type="submit">Filtrer</button>
        </form>

        {articles.status !== "ready" ? (
          <p className={admin.noticeBox}>{articles.message}</p>
        ) : data.length === 0 ? (
          <section className={admin.emptyState}>
            <FileText size={34} />
            <h2>Aucun contenu</h2>
            <p>Ajoutez votre premier article pour commencer à construire la partie éditoriale du site.</p>
            {canWrite ? <Link className={admin.primaryButton} href="/admin/contenus/nouveau"><Plus size={18} /> Nouveau contenu</Link> : null}
          </section>
        ) : (
          <section className={admin.articleList}>
            {data.map((article) => (
              <article key={article.id} className={admin.articleRow}>
                <div>
                  <div className={admin.articleBadges}>
                    <span className={admin.statusBadge} data-status={article.status}>{statusLabels[article.status]}</span>
                    <span className={admin.categoryBadge}>{article.category}</span>
                  </div>
                  <h2>{article.title}</h2>
                  <p>{article.excerpt ?? "Sans résumé pour le moment."}</p>
                  <small>/{article.slug} · {article.reading_minutes} min · {formatArticleDate(article.published_at)}</small>
                </div>
                <div className={admin.articleActions}>
                  {article.status === "published" ? <Link href={`/contenus/${article.slug}`} target="_blank">Voir</Link> : null}
                  <Link href={`/admin/contenus/${article.id}`}>Modifier</Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </section>
    </main>
  );
}

export function AdminContentSidebar() {
  return (
    <aside className={admin.sidebar}>
      <div className={admin.brandMark}><span>les jumelles</span><strong>IMMO</strong></div>
      <nav>
        <Link href="/admin/biens">Biens</Link>
        <Link href="/admin/recherches">Recherches</Link>
        <Link href="/admin/estimations">Estimations</Link>
        <Link href="/admin/parrainages">Parrainages</Link>
        <Link href="/admin/clients">Clients</Link>
        <Link href="/admin/recherches-villes">Villes recherchées</Link>
        <Link data-active href="/admin/contenus">Contenus</Link>
        <Link href="/admin/utilisateurs">Utilisateurs</Link>
      </nav>
    </aside>
  );
}
