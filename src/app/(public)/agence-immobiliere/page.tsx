import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, Handshake, MapPin } from "lucide-react";
import { southCities } from "@/lib/cities";
import { createPageMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";
import styles from "../estimation-immobiliere/estimation-cities.module.css";

export const metadata: Metadata = createPageMetadata({
  title: "Agence immobilière Var et Bouches-du-Rhône | Les Jumelles Immo",
  description:
    "Les Jumelles Immo vous accompagnent pour estimer, valoriser et vendre votre maison ou appartement dans le Var et les Bouches-du-Rhône.",
  path: "/agence-immobiliere",
});

const agencyCities = southCities.filter((city) =>
  ["Bouches-du-Rhone", "Var"].includes(city.department),
);

const departments = [
  { key: "Bouches-du-Rhone", label: "Bouches-du-Rhône (13)" },
  { key: "Var", label: "Var (83)" },
] as const;

const agencyFaqs = [
  {
    question: "Dans quelles villes intervenez-vous dans le Var et les Bouches-du-Rhône ?",
    answer:
      "Les Jumelles Immo interviennent dans les communes référencées sur cette page, notamment autour d’Aubagne, Marseille, Aix-en-Provence, La Ciotat, Toulon, Bandol, Sanary-sur-Mer et Hyères. Chaque page locale présente les repères de marché et l’accompagnement proposé dans la ville.",
  },
  {
    question: "Votre agence immobilière accompagne-t-elle les vendeurs jusqu’à la signature ?",
    answer:
      "Oui. Nous réalisons l’estimation, définissons la stratégie de commercialisation, préparons la présentation du bien, organisons les visites, accompagnons la négociation et coordonnons le dossier jusqu’à la signature définitive.",
  },
  {
    question: "Pouvez-vous estimer une maison comme un appartement ?",
    answer:
      "Oui. L’analyse tient compte du type de bien et de ses caractéristiques propres. Terrain, extérieurs et potentiel sont particulièrement étudiés pour une maison ; étage, copropriété, ascenseur, charges et stationnement le sont pour un appartement.",
  },
  {
    question: "Pourquoi associer immobilier, urbanisme et architecture intérieure ?",
    answer:
      "Cette triple compétence permet de mieux comprendre le potentiel réel d’un bien, d’identifier les améliorations utiles et de présenter aux acquéreurs des possibilités crédibles, sans surévaluer ni masquer les contraintes du logement.",
  },
];

export default function AgencyCitiesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Agences immobilières", item: absoluteUrl("/agence-immobiliere") },
        ],
      },
      {
        "@type": "Service",
        name: "Agence immobilière dans le Var et les Bouches-du-Rhône",
        serviceType: ["Estimation immobilière", "Transaction immobilière", "Valorisation immobilière"],
        areaServed: [
          { "@type": "AdministrativeArea", name: "Bouches-du-Rhône" },
          { "@type": "AdministrativeArea", name: "Var" },
        ],
        provider: { "@id": `${absoluteUrl("/")}#organization` },
        url: absoluteUrl("/agence-immobiliere"),
      },
      {
        "@type": "FAQPage",
        mainEntity: agencyFaqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
  };

  return (
    <main className={styles.page}>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        type="application/ld+json"
      />
      <nav className={styles.breadcrumb} aria-label="Fil d’Ariane">
        <Link href="/">Accueil</Link><span>/</span><span>Agences immobilières</span>
      </nav>

      <header className={styles.hero}>
        <p>Accompagnement local</p>
        <h1>Agence immobilière dans le Var et les Bouches-du-Rhône</h1>
        <span>
          Les Jumelles Immo accompagnent les propriétaires pour estimer, valoriser et
          vendre leur maison ou appartement avec une stratégie adaptée au marché local.
        </span>
        <Link href="/estimation">Nous confier un projet <ArrowRight size={17} /></Link>
      </header>

      <section className={styles.intro}>
        <div><MapPin /><strong>{agencyCities.length} secteurs couverts</strong></div>
        <div><Building2 /><strong>Maisons et appartements</strong></div>
        <div><Handshake /><strong>Suivi jusqu’à la signature</strong></div>
      </section>

      <section className={styles.agencyServices} aria-labelledby="agency-services-title">
        <div className={styles.agencyLead}>
          <p>Estimer, préparer et vendre</p>
          <h2 id="agency-services-title">Une agence immobilière engagée à chaque étape de votre vente</h2>
          <span>
            Une moyenne au m² donne un repère. Pour défendre la valeur d’un bien, il faut aussi
            comprendre son adresse, son état, son potentiel et les attentes des acquéreurs dans le secteur.
          </span>
        </div>
        <div className={styles.serviceGrid}>
          <article><strong>01</strong><h3>Estimation locale</h3><p>Données de transactions, biens comparables et visite sur place pour construire un prix argumenté.</p></article>
          <article><strong>02</strong><h3>Transaction immobilière</h3><p>Commercialisation, visites qualifiées, négociation et suivi du dossier jusqu’à la signature.</p></article>
          <article><strong>03</strong><h3>Valorisation du bien</h3><p>Immobilier, urbanisme et architecture intérieure pour révéler un potentiel crédible aux acquéreurs.</p></article>
        </div>
      </section>

      {departments.map((department) => (
        <section className={styles.department} key={department.key}>
          <div className={styles.heading}><p>Nos secteurs</p><h2>{department.label}</h2></div>
          <div className={styles.grid}>
            {agencyCities.filter((city) => city.department === department.key).map((city) => (
              <Link className={styles.agencyCityCard} href={`/agence-immobiliere/${city.slug}`} key={city.slug}>
                <span>Les Jumelles Immo</span>
                <h3>Agence immobilière à {city.name}</h3>
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            ))}
          </div>
        </section>
      ))}

      <section className={styles.agencyApproach} aria-labelledby="agency-approach-title">
        <div>
          <p>La méthode Les Jumelles Immo</p>
          <h2 id="agency-approach-title">Une expertise immobilière locale renforcée par la donnée et le terrain</h2>
        </div>
        <div>
          <p>
            Nos pages locales réunissent prix au m², ventes récentes et critères de valeur. Ces
            informations préparent l’échange, mais l’estimation finale reste affinée par la visite
            et par la réalité du marché au moment de la vente.
          </p>
          <nav aria-label="Approfondir votre projet">
            <Link href="/estimation-immobiliere">Estimations immobilières par ville <ArrowRight size={15} /></Link>
            <Link href="/prix-m2">Prix immobiliers par ville <ArrowRight size={15} /></Link>
            <Link href="/qui-sommes-nous">Découvrir Les Jumelles Immo <ArrowRight size={15} /></Link>
          </nav>
        </div>
      </section>

      <section className={styles.agencyFaq} aria-labelledby="agency-faq-title">
        <div><p>Questions fréquentes</p><h2 id="agency-faq-title">Choisir une agence immobilière dans votre secteur</h2></div>
        <div>
          {agencyFaqs.map((faq) => (
            <details key={faq.question}>
              <summary>{faq.question}<span aria-hidden="true">+</span></summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
