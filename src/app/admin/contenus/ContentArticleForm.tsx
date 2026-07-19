"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState } from "react";
import { Save } from "lucide-react";
import type { ContentArticle } from "@/lib/content/articles";
import admin from "../admin.module.css";
import { createContentArticleAction, updateContentArticleAction } from "./actions";
import { BlogImageUploader, type UploadedBlogImage } from "./BlogImageUploader";

type ContentArticleFormProps = {
  article?: ContentArticle;
};

export function ContentArticleForm({ article }: ContentArticleFormProps) {
  const action = article ? updateContentArticleAction : createContentArticleAction;
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [bodyMarkdown, setBodyMarkdown] = useState(article?.body_markdown ?? "");
  const [bodyImageAlt, setBodyImageAlt] = useState("");
  const [coverImageAlt, setCoverImageAlt] = useState(article?.cover_image_alt ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(article?.cover_image_url ?? "");

  function insertBodyImage(image: UploadedBlogImage) {
    const alt = bodyImageAlt.trim() || "Photo illustrant l’article immobilier";
    const markdown = `![${alt}](${image.url} \"${image.width}x${image.height}\")`;
    const editor = editorRef.current;
    const start = editor?.selectionStart ?? bodyMarkdown.length;
    const end = editor?.selectionEnd ?? start;
    const before = bodyMarkdown.slice(0, start).replace(/\s*$/, "");
    const after = bodyMarkdown.slice(end).replace(/^\s*/, "");
    const insertionPrefix = before ? "\n\n" : "";
    const nextValue = `${before}${insertionPrefix}${markdown}${after ? `\n\n${after}` : ""}`;
    const nextCursor = before.length + insertionPrefix.length + markdown.length;

    setBodyMarkdown(nextValue);
    setBodyImageAlt("");
    requestAnimationFrame(() => {
      editor?.focus();
      editor?.setSelectionRange(nextCursor, nextCursor);
    });
  }

  return (
    <form action={action} className={admin.contentForm}>
      {article ? <input name="id" type="hidden" value={article.id} /> : null}
      <section className={admin.formPanel}>
        <div className={admin.formIntro}>
          <p className={admin.eyebrow}>Contenu editorial</p>
          <h2>Article</h2>
          <p>Rédigez un contenu utile, local et indexable. Les contenus restent invisibles tant qu’ils ne sont pas publiés.</p>
        </div>
        <div className={admin.formGrid}>
          <label>
            Titre
            <input name="title" required defaultValue={article?.title ?? ""} placeholder="Prix m² à La Ciotat : comprendre le marché local" />
          </label>
          <label>
            Slug SEO
            <input name="slug" defaultValue={article?.slug ?? ""} placeholder="prix-m2-la-ciotat" />
            <small>Laissez vide pour le générer automatiquement depuis le titre.</small>
          </label>
          <label>
            Statut
            <select name="status" defaultValue={article?.status ?? "draft"}>
              <option value="draft">Brouillon</option>
              <option value="published">Publié</option>
              <option value="archived">Archivé</option>
            </select>
          </label>
          <label>
            Catégorie
            <input name="category" defaultValue={article?.category ?? "conseils"} placeholder="conseils" />
          </label>
          <label>
            Mot-clé principal
            <input name="primaryKeyword" defaultValue={article?.primary_keyword ?? ""} placeholder="prix m2 La Ciotat" />
          </label>
          <label>
            Ville liée
            <input name="relatedCitySlug" defaultValue={article?.related_city_slug ?? ""} placeholder="la-ciotat" />
          </label>
        </div>
      </section>

      <section className={admin.formPanel}>
        <div className={admin.formIntro}>
          <p className={admin.eyebrow}>Lecture</p>
          <h2>Corps de page</h2>
          <p>Markdown simple accepté : titres avec <code>##</code>, listes avec <code>-</code>, paragraphes séparés par une ligne vide.</p>
        </div>
        <label>
          Chapô
          <textarea name="excerpt" defaultValue={article?.excerpt ?? ""} rows={3} placeholder="Un résumé court qui donne envie de lire et clarifie l’intention SEO." />
        </label>
        <label>
          Contenu
          <textarea
            className={admin.editorArea}
            name="bodyMarkdown"
            required
            rows={18}
            onChange={(event) => setBodyMarkdown(event.target.value)}
            placeholder={"## Comprendre le prix au m²\n\nExpliquez ici le marché local, les écarts entre quartiers, les critères qui valorisent un bien...\n\n- Urbanisme\n- Potentiel d’agrandissement\n- Optimisation des espaces"}
            ref={editorRef}
            value={bodyMarkdown}
          />
        </label>
        <div className={admin.bodyImageTools}>
          <label>
            Texte alternatif de la photo à insérer
            <input
              onChange={(event) => setBodyImageAlt(event.target.value)}
              placeholder="Ex. Séjour lumineux avec vue mer à La Ciotat"
              value={bodyImageAlt}
            />
            <small>Décrivez précisément ce que montre l’image, sans accumuler les mots-clés.</small>
          </label>
          <BlogImageUploader
            altText={bodyImageAlt}
            label="Optimiser et insérer une photo"
            onUploaded={insertBodyImage}
          />
        </div>
      </section>

      <section className={admin.formPanel}>
        <div className={admin.formIntro}>
          <p className={admin.eyebrow}>SEO</p>
          <h2>Référencement</h2>
          <p>Ces champs permettent de piloter l’affichage Google sans toucher au code.</p>
        </div>
        <div className={admin.formGrid}>
          <label>
            Title SEO
            <input name="seoTitle" defaultValue={article?.seo_title ?? ""} placeholder="Prix m² La Ciotat : analyse immobilière locale" />
          </label>
          <label>
            Meta description
            <textarea name="seoDescription" defaultValue={article?.seo_description ?? ""} rows={4} placeholder="Découvrez les prix immobiliers à La Ciotat, les tendances locales et les leviers pour vendre au meilleur prix." />
          </label>
          <label>
            Texte alternatif image
            <input
              name="coverImageAlt"
              onChange={(event) => setCoverImageAlt(event.target.value)}
              placeholder="Vue immobilière locale"
              value={coverImageAlt}
            />
          </label>
        </div>
        <div className={admin.coverImageEditor}>
          <div>
            <label>
              URL de l’image de couverture
              <input
                name="coverImageUrl"
                onChange={(event) => setCoverImageUrl(event.target.value)}
                placeholder="/images/..."
                value={coverImageUrl}
              />
            </label>
            <BlogImageUploader
              altText={coverImageAlt}
              label="Choisir et optimiser la couverture"
              onUploaded={(image) => setCoverImageUrl(image.url)}
            />
          </div>
          {coverImageUrl ? (
            <div className={admin.coverImagePreview}>
              <Image alt={coverImageAlt || "Aperçu de la couverture"} fill sizes="420px" src={coverImageUrl} />
            </div>
          ) : null}
        </div>
      </section>

      <div className={admin.formActions}>
        <Link className={admin.secondaryButton} href="/admin/contenus">Annuler</Link>
        <button className={admin.primaryButton} type="submit"><Save size={17} /> Enregistrer</button>
      </div>
    </form>
  );
}
