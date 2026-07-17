import Link from "next/link";
import Image from "next/image";
import { UserRound } from "lucide-react";
import styles from "./public-site.module.css";

export function PublicHeader() {
  return (
    <header className={styles.header}>
      <Link className={styles.logo} href="/" aria-label="Les Jumelles Immo — accueil">
        <Image
          alt="Les Jumelles Immo"
          height={314}
          priority
          src="/brand/logo-jumelles-immo-black.svg"
          width={790}
        />
      </Link>
      <nav className={styles.nav} aria-label="Navigation principale">
        <Link href="/prix-m2">Prix immobilier</Link>
        <Link href="/estimation">Estimer</Link>
        <Link href="/recherche">Rechercher</Link>
        <Link href="/#conseils">Conseils</Link>
        <Link href="/#secteurs">Nos secteurs</Link>
        <Link href="/qui-sommes-nous">Qui sommes-nous</Link>
      </nav>
      <Link className={styles.accountLink} href="/client"><UserRound size={18} /> Mon compte</Link>
    </header>
  );
}
