import Link from "next/link";
import Image from "next/image";
import styles from "./public-site.module.css";

export function PublicFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerTop}>
        <div className={styles.footerBrand}>
          <Link className={styles.footerLogo} href="/" aria-label="Les Jumelles Immo — accueil">
            <Image alt="Les Jumelles Immo" height={314} src="/brand/logo-jumelles-immo-blanc.svg" width={790} />
          </Link>
          <p>Une expertise locale renforcée par la donnée.</p>
        </div>
        <div className={styles.footerColumns} id="a-propos">
          <nav aria-label="Services"><strong>Services</strong><Link href="/prix-m2">Prix immobilier par ville</Link><Link href="/estimation">Estimer mon bien</Link><Link href="/recherche">Recherche accompagnée</Link></nav>
          <nav aria-label="Ressources"><strong>Ressources</strong><Link href="/#conseils">Conseils & analyses</Link><Link href="/#secteurs">Nos secteurs</Link><Link href="/client">Espace client</Link></nav>
          <nav aria-label="L'agence"><strong>L’agence</strong><Link href="/qui-sommes-nous">Qui sommes-nous</Link><Link href="/nous-rejoindre">Nous rejoindre</Link><Link href="/honoraires">Honoraires</Link><Link href="/recherche">Nous confier un projet</Link><Link href="/estimation">Nous contacter</Link></nav>
        </div>
      </div>
      <div className={styles.fnaimTrust}>
        <div className={styles.fnaimMark}>
          <Image alt="FNAIM" height={78} src="/brand/logo-fnaim.png" width={100} />
        </div>
        <div>
          <p>Agence adhérente FNAIM</p>
          <h2>Un engagement professionnel reconnu</h2>
          <span>Un cadre exigeant pour vous accompagner avec sérieux, transparence et maîtrise du marché.</span>
        </div>
        <strong>Votre projet mérite des repères solides.</strong>
      </div>
      <div className={styles.footerBottom}>
        <p>© {new Date().getFullYear()} Les Jumelles Immo</p>
        <p>Immobilier local, données utiles et accompagnement humain.</p>
      </div>
    </footer>
  );
}
