import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requireAdminSession } from "@/lib/admin/auth";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { getAdminContentArticle } from "@/lib/content/articles";
import admin from "../../admin.module.css";
import { ContentArticleForm } from "../ContentArticleForm";
import { AdminContentSidebar } from "../page";

export const metadata: Metadata = {
  title: "Modifier un contenu | Admin Les Jumelles Immo",
};

export const dynamic = "force-dynamic";

export default async function EditContentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const session = await requireAdminSession();
  await requireAdminPermission(session, "contents:write");
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const article = await getAdminContentArticle(id);

  if (article.status === "ready" && !article.data) {
    notFound();
  }

  return (
    <main className={admin.adminPage}>
      <AdminContentSidebar />
      <section className={admin.content}>
        <header className={admin.pageHeader}>
          <div>
            <p className={admin.eyebrow}>Modifier un contenu</p>
            <h1>{article.status === "ready" ? article.data?.title : "Contenu"}</h1>
            <p>Chaque publication alimente directement la partie publique /contenus/ du site.</p>
          </div>
          <div className={admin.headerActions}>
            <Link className={admin.secondaryButton} href="/admin/contenus"><ArrowLeft size={17} /> Retour</Link>
            {article.status === "ready" && article.data?.status === "published" ? (
              <Link className={admin.primaryButton} href={`/contenus/${article.data.slug}`} target="_blank"><ExternalLink size={17} /> Voir</Link>
            ) : null}
          </div>
        </header>
        {query.saved ? <p className={admin.successText}>Contenu enregistré.</p> : null}
        {query.error ? <p className={admin.errorText}>{query.error}</p> : null}
        {article.status !== "ready" || !article.data ? <p className={admin.noticeBox}>{article.status !== "ready" ? article.message : "Contenu introuvable."}</p> : <ContentArticleForm article={article.data} />}
      </section>
    </main>
  );
}
