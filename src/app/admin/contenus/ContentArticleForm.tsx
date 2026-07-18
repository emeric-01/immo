import Link from "next/link";
import { Save } from "lucide-react";
import type { ContentArticle } from "@/lib/content/articles";
import admin from "../admin.module.css";
import { createContentArticleAction, updateContentArticleAction } from "./actions";

type ContentArticleFormProps = {
  article?: ContentArticle;
};

export function ContentArticleForm({ article }: ContentArticleFormProps) {
  const action = article ? updateContentArticleAction : createContentArticleAction;

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
            defaultValue={article?.body_markdown ?? ""}
            placeholder={"## Comprendre le prix au m²\n\nExpliquez ici le marché local, les écarts entre quartiers, les critères qui valorisent un bien...\n\n- Urbanisme\n- Potentiel d’agrandissement\n- Optimisation des espaces"}
          />
        </label>
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
            Image de couverture
            <input name="coverImageUrl" defaultValue={article?.cover_image_url ?? ""} placeholder="/images/..." />
          </label>
          <label>
            Texte alternatif image
            <input name="coverImageAlt" defaultValue={article?.cover_image_alt ?? ""} placeholder="Vue immobilière locale" />
          </label>
        </div>
      </section>

      <div className={admin.formActions}>
        <Link className={admin.secondaryButton} href="/admin/contenus">Annuler</Link>
        <button className={admin.primaryButton} type="submit"><Save size={17} /> Enregistrer</button>
      </div>
    </form>
  );
}
