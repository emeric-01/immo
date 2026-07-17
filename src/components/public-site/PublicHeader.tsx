import Link from "next/link";
import { UserRound } from "lucide-react";
import styles from "./public-site.module.css";

export function PublicHeader() {
  return (
    <header className={styles.header}>
      <Link className={styles.logo} href="/" aria-label="Les Jumelles Immo — accueil">
        <span>les jumelles</span>
        <strong>IMMO</strong>
      </Link>
      <nav className={styles.nav} aria-label="Navigation principale">
        <Link href="/prix-m2/aubagne">Prix immobilier</Link>
        <Link href="/estimation">Estimer</Link>
        <Link href="/recherche">Rechercher</Link>
        <Link href="/#conseils">Conseils</Link>
        <Link href="/#secteurs">Nos secteurs</Link>
        <Link href="/#a-propos">À propos</Link>
      </nav>
      <Link className={styles.accountLink} href="/client"><UserRound size={18} /> Mon compte</Link>
    </header>
  );
}
