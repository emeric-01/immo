import { southCities } from "@/lib/cities";
import { absoluteUrl } from "@/lib/site";

type LlmsArticle = {
  excerpt: string | null;
  slug: string;
  title: string;
};

type LlmsProperty = {
  city_name: string;
  seo_noindex: boolean;
  slug: string;
  status: "draft" | "published" | "sold" | "archived";
  title: string;
};

type LlmsTextOptions = {
  articles: LlmsArticle[];
  properties: LlmsProperty[];
};

function link(label: string, path: string, description?: string) {
  return `- [${label}](${absoluteUrl(path)})${description ? `: ${description}` : ""}`;
}

export function buildLlmsText({ articles, properties }: LlmsTextOptions) {
  const localCities = southCities.filter((city) =>
    ["Bouches-du-Rhone", "Var"].includes(city.department),
  );
  const publicProperties = properties.filter((property) =>
    !property.seo_noindex && ["published", "sold"].includes(property.status),
  );

  return [
    "# Les Jumelles Immo",
    "",
    "> Agence immobiliere locale en Provence : prix immobiliers, estimation, vente et recherche de biens.",
    "",
    `- Site officiel: ${absoluteUrl("/")}`,
    "- Langue principale: fr-FR",
    `- Sitemap XML: ${absoluteUrl("/sitemap.xml")}`,
    "- Zone principale: Aubagne, Marseille Est, Pays d'Aix, La Ciotat et Ouest Var",
    "",
    "## Services principaux",
    "",
    link("Prix immobiliers locaux", "/prix-m2", "prix au m2, tendances et transactions DVF"),
    link("Estimation immobiliere", "/estimation", "parcours d'estimation d'un appartement ou d'une maison"),
    link("Biens a vendre", "/biens", "annonces immobilieres publiees par l'agence"),
    link("Recherche immobiliere", "/recherche", "depot d'un projet d'achat immobilier"),
    link("Conseils et contenus", "/contenus", "analyses locales et conseils immobiliers"),
    link("Agence et equipe", "/qui-sommes-nous"),
    link("Parrainage immobilier", "/parrainage"),
    "",
    "## Prix au m2 par ville",
    "",
    ...southCities.map((city) => link(`Prix m2 a ${city.name}`, `/prix-m2/${city.slug}`)),
    "",
    "## Estimation immobiliere locale",
    "",
    ...localCities.map((city) =>
      link(`Estimation immobiliere a ${city.name}`, `/estimation-immobiliere/${city.slug}`),
    ),
    "",
    "## Agence immobiliere par secteur",
    "",
    ...localCities.map((city) =>
      link(`Agence immobiliere a ${city.name}`, `/agence-immobiliere/${city.slug}`),
    ),
    "",
    "## Contenus editoriaux publies",
    "",
    ...(articles.length > 0
      ? articles.map((article) => link(article.title, `/contenus/${article.slug}`, article.excerpt ?? undefined))
      : ["- Aucun contenu editorial publie pour le moment."]),
    "",
    "## Biens immobiliers publies",
    "",
    ...(publicProperties.length > 0
      ? publicProperties.map((property) =>
        link(
          property.title,
          `/biens/${property.slug}`,
          `${property.city_name}${property.status === "sold" ? " - bien vendu" : ""}`,
        ))
      : ["- Aucun bien publie pour le moment."]),
    "",
    "## Sources et mise a jour",
    "",
    "Les pages de prix immobiliers utilisent des transactions DVF et des indicateurs locaux mis en cache.",
    "Les annonces et contenus sont geres par Les Jumelles Immo. Les donnees personnelles, l'administration et les espaces clients ne sont pas publics.",
    "",
  ].join("\n");
}
