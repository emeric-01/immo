"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin/auth";
import { requireAdminPermission } from "@/lib/admin/permissions";
import {
  createContentArticle,
  parseArticleFormData,
  updateContentArticle,
  validateArticleInput,
} from "@/lib/content/articles";

export async function createContentArticleAction(formData: FormData) {
  const session = await requireAdminSession();
  await requireAdminPermission(session, "contents:write");
  const input = parseArticleFormData(formData);
  const validationError = validateArticleInput(input);

  if (validationError) {
    redirect(`/admin/contenus/nouveau?error=${encodeURIComponent(validationError)}`);
  }

  let articleId = "";

  try {
    const article = await createContentArticle(input, session.id === "bootstrap" ? null : session.id);
    articleId = article.id;
  } catch (error) {
    redirect(`/admin/contenus/nouveau?error=${encodeURIComponent(error instanceof Error ? error.message : "Creation impossible")}`);
  }

  revalidatePath("/contenus");
  revalidatePath("/admin/contenus");
  redirect(`/admin/contenus/${articleId}?saved=1`);
}

export async function updateContentArticleAction(formData: FormData) {
  const session = await requireAdminSession();
  await requireAdminPermission(session, "contents:write");
  const id = String(formData.get("id") ?? "");
  const input = parseArticleFormData(formData);
  const validationError = validateArticleInput(input);

  if (!id) {
    redirect("/admin/contenus?error=Contenu introuvable");
  }

  if (validationError) {
    redirect(`/admin/contenus/${id}?error=${encodeURIComponent(validationError)}`);
  }

  let slug = "";

  try {
    const article = await updateContentArticle(id, input, session.id === "bootstrap" ? null : session.id);
    slug = article.slug;
  } catch (error) {
    redirect(`/admin/contenus/${id}?error=${encodeURIComponent(error instanceof Error ? error.message : "Enregistrement impossible")}`);
  }

  revalidatePath("/contenus");
  revalidatePath(`/contenus/${slug}`);
  revalidatePath("/admin/contenus");
  revalidatePath(`/admin/contenus/${id}`);
  redirect(`/admin/contenus/${id}?saved=1`);
}
