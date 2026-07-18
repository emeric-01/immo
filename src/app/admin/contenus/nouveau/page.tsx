import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdminSession } from "@/lib/admin/auth";
import { requireAdminPermission } from "@/lib/admin/permissions";
import admin from "../../admin.module.css";
import { ContentArticleForm } from "../ContentArticleForm";
import { AdminContentSidebar } from "../page";

export const metadata: Metadata = {
  title: "Nouveau contenu | Admin Les Jumelles Immo",
};

export const dynamic = "force-dynamic";

export default async function NewContentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireAdminSession();
  await requireAdminPermission(session, "contents:write");
  const params = await searchParams;

  return (
    <main className={admin.adminPage}>
      <AdminContentSidebar />
      <section className={admin.content}>
        <header className={admin.pageHeader}>
          <div>
            <p className={admin.eyebrow}>Nouveau contenu</p>
            <h1>Rédiger une page</h1>
            <p>Préparez un brouillon, optimisez le SEO, puis publiez quand le contenu est prêt.</p>
          </div>
          <Link className={admin.secondaryButton} href="/admin/contenus"><ArrowLeft size={17} /> Retour</Link>
        </header>
        {params.error ? <p className={admin.errorText}>{params.error}</p> : null}
        <ContentArticleForm />
      </section>
    </main>
  );
}
