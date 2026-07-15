import type { Metadata } from "next";
import Link from "next/link";
import styles from "./home.module.css";

export const metadata: Metadata = {
  title: "Les Jumelles Immo | Votre projet immobilier",
  description:
    "Estimez votre bien ou déposez votre recherche immobilière auprès des Jumelles Immo.",
};

export default function HomePage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Les Jumelles Immo</p>
        <h1>Un accompagnement immobilier pensé autour de votre projet.</h1>
        <p className={styles.intro}>
          Vous vendez ou vous cherchez votre futur bien ? Commencez par le parcours qui vous correspond.
        </p>
        <div className={styles.actions}>
          <Link className={styles.primaryAction} href="/estimation">
            Estimer mon bien
          </Link>
          <Link className={styles.secondaryAction} href="/recherche">
            Déposer ma recherche
          </Link>
        </div>
      </section>

      <section className={styles.paths} aria-labelledby="paths-title">
        <div className={styles.sectionHeading}>
          <p>Deux projets, deux parcours dédiés</p>
          <h2 id="paths-title">Commencez simplement.</h2>
        </div>
        <div className={styles.pathGrid}>
          <article>
            <span>01</span>
            <h3>Je souhaite vendre</h3>
            <p>Obtenez une première estimation, puis affinez-la avec les caractéristiques de votre bien.</p>
            <Link href="/estimation">Lancer une estimation →</Link>
          </article>
          <article>
            <span>02</span>
            <h3>Je recherche un bien</h3>
            <p>Décrivez votre secteur, votre budget et vos priorités pour créer une recherche exploitable.</p>
            <Link href="/recherche">Créer ma recherche →</Link>
          </article>
        </div>
      </section>
    </main>
  );
}
