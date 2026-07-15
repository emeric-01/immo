import Link from "next/link";
import styles from "./public-site.module.css";

export function PublicHeader() {
  return (
    <header className={styles.header}>
      <Link className={styles.logo} href="/" aria-label="Les Jumelles Immo — accueil">
        <span>les jumelles</span>
        <strong>IMMO</strong>
      </Link>
      <nav className={styles.nav} aria-label="Navigation principale">
        <Link href="/">Accueil</Link>
        <Link href="/estimation">Estimer et vendre</Link>
        <Link href="/recherche">Déposer une recherche</Link>
        <Link href="/client">Espace client</Link>
      </nav>
    </header>
  );
}
