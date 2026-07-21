import Link from "next/link";
import { ArrowRight, Building2, Calculator, Home, MapPin } from "lucide-react";
import styles from "./not-found.module.css";

export function NotFoundContent() {
  return <main className={styles.page}>
    <section className={styles.hero}>
      <div className={styles.code} aria-hidden="true">404</div>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>Page indisponible</p>
        <h1>Cette adresse ne mène plus ici.</h1>
        <p>L’annonce a peut-être été vendue ou la page a changé d’adresse. Votre projet, lui, peut continuer.</p>
        <div className={styles.actions}>
          <Link className={styles.primary} href="/"><Home aria-hidden="true" size={17}/> Revenir à l’accueil</Link>
          <Link className={styles.secondary} href="/recherche">Nous confier votre recherche <ArrowRight aria-hidden="true" size={17}/></Link>
        </div>
      </div>
    </section>

    <section aria-label="Continuer votre navigation" className={styles.paths}>
      <Link href="/prix-m2"><span><MapPin aria-hidden="true"/></span><div><strong>Consulter les prix au m²</strong><small>Retrouvez les données de votre ville</small></div><ArrowRight aria-hidden="true"/></Link>
      <Link href="/estimation"><span><Calculator aria-hidden="true"/></span><div><strong>Estimer un bien</strong><small>Obtenez une première estimation</small></div><ArrowRight aria-hidden="true"/></Link>
      <Link href="/recherche"><span><Building2 aria-hidden="true"/></span><div><strong>Déposer une recherche</strong><small>Décrivez-nous votre projet immobilier</small></div><ArrowRight aria-hidden="true"/></Link>
    </section>
  </main>;
}
