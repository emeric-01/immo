import Link from "next/link";
import Image from "next/image";
import styles from "./public-site.module.css";

export function PublicFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerTop}>
        <div className={styles.footerBrand}>
          <Link className={styles.footerLogo} href="/" aria-label="Les Jumelles Immo — accueil">
            <Image alt="Les Jumelles Immo" height={138} src="/brand/les-jumelles-logo-blanc-complet.png" width={200} />
          </Link>
          <p>Une expertise locale renforcée par la donnée.</p>
          <div className={styles.fnaimBadge}>
            <Image alt="FNAIM" height={55} src="/brand/logo-fnaim.png" width={70} />
            <span><strong>Adhérent FNAIM</strong><small>Professionnel de l’immobilier</small></span>
          </div>
        </div>
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
