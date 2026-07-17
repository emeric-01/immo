import Link from "next/link";
import styles from "./public-site.module.css";

export function PublicFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerTop}>
        <Link className={styles.footerLogo} href="/" aria-label="Les Jumelles Immo — accueil">
          <span>les jumelles</span>
          <strong>IMMO</strong>
        </Link>
        <div className={styles.footerColumns} id="a-propos">
          <nav aria-label="Services"><strong>Services</strong><Link href="/prix-m2/aubagne">Prix immobilier</Link><Link href="/estimation">Estimer mon bien</Link><Link href="/recherche">Recherche accompagnée</Link></nav>
          <nav aria-label="Ressources"><strong>Ressources</strong><Link href="/#conseils">Conseils & analyses</Link><Link href="/#secteurs">Nos secteurs</Link><Link href="/client">Espace client</Link></nav>
          <nav aria-label="L'agence"><strong>L’agence</strong><Link href="/recherche">Nous confier un projet</Link><Link href="/estimation">Nous contacter</Link></nav>
        </div>
      </div>
      <div className={styles.footerBottom}>
        <p>© {new Date().getFullYear()} Les Jumelles Immo</p>
        <p>Immobilier local, données utiles et accompagnement humain.</p>
      </div>
    </footer>
  );
}
