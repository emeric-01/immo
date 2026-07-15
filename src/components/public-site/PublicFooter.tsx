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
        <nav className={styles.footerNav} aria-label="Navigation de pied de page">
          <Link href="/estimation">Estimer un bien</Link>
          <Link href="/recherche">Déposer une recherche</Link>
          <Link href="/client">Espace client</Link>
        </nav>
      </div>
      <div className={styles.footerBottom}>
        <p>© {new Date().getFullYear()} Les Jumelles Immo</p>
        <p>Vos projets immobiliers, suivis avec attention.</p>
      </div>
    </footer>
  );
}
