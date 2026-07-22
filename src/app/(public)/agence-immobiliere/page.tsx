import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, Handshake, MapPin } from "lucide-react";
import { southCities } from "@/lib/cities";
import { createPageMetadata } from "@/lib/seo";
import styles from "../estimation-immobiliere/estimation-cities.module.css";

export const metadata: Metadata = createPageMetadata({
  title: "Agences immobilières par ville | Les Jumelles Immo",
  description:
    "Découvrez l’accompagnement des Jumelles Immo pour estimer, valoriser et vendre votre bien dans les Bouches-du-Rhône et le Var.",
  path: "/agence-immobiliere",
});

const agencyCities = southCities.filter((city) =>
  ["Bouches-du-Rhone", "Var"].includes(city.department),
);

const departments = [
  { key: "Bouches-du-Rhone", label: "Bouches-du-Rhône (13)" },
  { key: "Var", label: "Var (83)" },
] as const;

export default function AgencyCitiesPage() {
  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Fil d’Ariane">
        <Link href="/">Accueil</Link><span>/</span><span>Agences immobilières</span>
      </nav>

      <header className={styles.hero}>
        <p>Accompagnement local</p>
        <h1>Agences immobilières par ville</h1>
        <span>
          Estimation, stratégie de commercialisation, visites et négociation : découvrez
          notre accompagnement immobilier dans votre secteur.
        </span>
        <Link href="/estimation">Nous confier un projet <ArrowRight size={17} /></Link>
      </header>

      <section className={styles.intro}>
        <div><MapPin /><strong>{agencyCities.length} secteurs couverts</strong></div>
        <div><Building2 /><strong>Maisons et appartements</strong></div>
        <div><Handshake /><strong>Suivi jusqu’à la signature</strong></div>
      </section>

      {departments.map((department) => (
        <section className={styles.department} key={department.key}>
          <div className={styles.heading}><p>Nos secteurs</p><h2>{department.label}</h2></div>
          <div className={styles.grid}>
            {agencyCities.filter((city) => city.department === department.key).map((city) => (
              <Link href={`/agence-immobiliere/${city.slug}`} key={city.slug}>
                <span>Agence immobilière</span>
                <strong>{city.name}</strong>
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
