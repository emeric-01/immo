import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, Home, MapPin } from "lucide-react";
import { southCities } from "@/lib/cities";
import { createPageMetadata } from "@/lib/seo";
import styles from "./estimation-cities.module.css";

export const metadata: Metadata = createPageMetadata({
  title: "Estimation immobilière par ville | Les Jumelles Immo",
  description:
    "Retrouvez nos pages d’estimation immobilière locale pour les maisons et appartements dans les Bouches-du-Rhône et le Var.",
  path: "/estimation-immobiliere",
});

const estimationCities = southCities.filter((city) =>
  ["Bouches-du-Rhone", "Var"].includes(city.department),
);

const departments = [
  { key: "Bouches-du-Rhone", label: "Bouches-du-Rhône (13)" },
  { key: "Var", label: "Var (83)" },
] as const;

export default function EstimationCitiesPage() {
  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Fil d’Ariane">
        <Link href="/">Accueil</Link><span>/</span><span>Estimations immobilières</span>
      </nav>

      <header className={styles.hero}>
        <p>Expertise locale</p>
        <h1>Estimation immobilière par ville</h1>
        <span>
          Maison ou appartement : consultez les ventes récentes, les prix locaux et les
          critères qui influencent la valeur de votre bien dans votre commune.
        </span>
        <Link href="/estimation">Estimer directement mon bien <ArrowRight size={17} /></Link>
      </header>

      <section className={styles.intro}>
        <div><MapPin /><strong>{estimationCities.length} secteurs couverts</strong></div>
        <div><Home /><strong>Maisons et appartements</strong></div>
        <div><Building2 /><strong>Données locales et analyse terrain</strong></div>
      </section>

      {departments.map((department) => (
        <section className={styles.department} key={department.key}>
          <div className={styles.heading}>
            <p>Nos secteurs</p>
            <h2>{department.label}</h2>
          </div>
          <div className={styles.grid}>
            {estimationCities
              .filter((city) => city.department === department.key)
              .map((city) => (
                <Link href={`/estimation-immobiliere/${city.slug}`} key={city.slug}>
                  <span>Estimation immobilière</span>
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
