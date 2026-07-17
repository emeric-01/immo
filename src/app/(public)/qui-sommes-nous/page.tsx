import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  Building2,
  DraftingCompass,
  Scale,
  Sparkles,
} from "lucide-react";
import styles from "./qui-sommes-nous.module.css";

export const metadata: Metadata = {
  title: "Qui sommes-nous ? | Les Jumelles Immo",
  description:
    "Découvrez Laure et Séverine Masfrand et l’approche Les Jumelles Immo : immobilier, urbanisme, architecture intérieure, IA et data au service de votre projet.",
};

const expertises = [
  {
    icon: Scale,
    title: "Droit & urbanisme",
    text: "Nous identifions les règles, contraintes et possibilités qui peuvent influencer un achat, une vente ou une transformation.",
  },
  {
    icon: DraftingCompass,
    title: "Architecture intérieure",
    text: "Nous révélons le potentiel d’un lieu par les usages, les volumes, la lumière et des projections d’aménagement réalistes.",
  },
  {
    icon: Building2,
    title: "Data immobilière",
    text: "Nous croisons les données du marché et la connaissance locale pour donner des repères concrets, lisibles et contextualisés.",
  },
  {
    icon: BrainCircuit,
    title: "IA & projection",
    text: "Nos outils accélèrent l’analyse et la visualisation d’un projet. L’expertise humaine reste au centre de chaque recommandation.",
  },
];

export default function QuiSommesNousPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="about-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Qui sommes-nous ?</p>
          <h1 id="about-title">
            Deux sœurs, deux expertises, <em>une vision globale.</em>
          </h1>
          <p className={styles.heroIntro}>
            Les Jumelles Immo réunit l’immobilier, l’urbanisme, l’architecture
            intérieure et les outils IA & Data pour mieux comprendre un bien,
            révéler son potentiel et sécuriser chaque décision.
          </p>
          <div className={styles.heroTags} aria-label="Nos domaines d’expertise">
            <span>Immobilier & urbanisme</span>
            <span>Architecture intérieure</span>
            <span>IA & Data</span>
          </div>
        </div>

        <figure className={styles.heroPortrait}>
          <Image
            alt="Laure et Séverine Masfrand, fondatrices des Jumelles Immo"
            className={styles.coverImage}
            fill
            priority
            sizes="(max-width: 860px) 100vw, 46vw"
            src="/images/laure-severine-jumelles-immo.jpg"
          />
          <figcaption>Laure & Séverine Masfrand</figcaption>
        </figure>
      </section>

      <section className={styles.story} aria-labelledby="story-title">
        <div className={styles.storyHeading}>
          <p className={styles.eyebrow}>Notre histoire</p>
          <h2 id="story-title">Une complicité devenue projet d’entreprise.</h2>
          <blockquote>
            « Même dans nos cabanes de fortune, nous pensions déjà au côté
            agréable et accueillant. »
          </blockquote>
        </div>
        <div className={styles.storyText}>
          <p>
            Nous sommes Laure et Séverine, deux sœurs jumelles. Bien avant la
            création de notre entreprise, nous partagions déjà une passion pour
            la décoration, la peinture et le dessin. Enfants, les cabanes que
            nous construisions dans le jardin devenaient déjà des lieux à
            aménager et à faire vivre.
          </p>
          <p>
            En grandissant, nous avons suivi des chemins différents et vécu
            éloignées pendant plus de dix ans, sans jamais perdre notre
            complicité. Laure s’est formée à l’École Boulle et a développé son
            expérience sur de nombreux projets et chantiers comme architecte
            d’intérieur au sein d’un cabinet reconnu. Séverine a suivi une voie
            juridique, spécialisée en urbanisme et immobilier.
          </p>
          <p>
            En 2020, nous avons concrétisé un rêve : nous retrouver autour d’un
            projet commun. Aujourd’hui, Les Jumelles Immo prolonge cette
            aventure avec la même intention : mettre nos regards complémentaires
            au service de projets immobiliers plus clairs, plus cohérents et
            plus humains.
          </p>
        </div>
      </section>

      <section className={styles.expertiseSection} aria-labelledby="expertise-title">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>Notre approche</p>
          <h2 id="expertise-title">Regarder le bien au-delà de ses mètres carrés.</h2>
          <p>
            Une adresse et un prix ne racontent jamais toute l’histoire. Nous
            réunissons quatre lectures complémentaires pour construire une
            vision utile du projet.
          </p>
        </div>
        <div className={styles.expertiseGrid}>
          {expertises.map(({ icon: Icon, title, text }, index) => (
            <article key={title}>
              <span className={styles.expertiseNumber}>0{index + 1}</span>
              <span className={styles.iconBadge} aria-hidden="true"><Icon /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.teamSection} aria-labelledby="team-title">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>L’équipe</p>
          <h2 id="team-title">Des compétences qui se répondent.</h2>
        </div>

        <div className={styles.teamGrid}>
          <article className={styles.sistersCard}>
            <div className={styles.sistersPortrait}>
              <Image
                alt="Laure et Séverine Masfrand"
                className={styles.coverImage}
                fill
                sizes="(max-width: 860px) 100vw, 44vw"
                src="/images/laure-severine-jumelles-immo.jpg"
              />
            </div>
            <div className={styles.sistersProfiles}>
              <div>
                <span>Architecture intérieure & design</span>
                <h3>Laure Masfrand</h3>
                <p>
                  Formée à l’École Boulle, Laure imagine les usages, les volumes
                  et les transformations capables de révéler la valeur d’un lieu.
                </p>
              </div>
              <div>
                <span>Droit, urbanisme & immobilier</span>
                <h3>Séverine Masfrand</h3>
                <p>
                  Séverine analyse le cadre juridique, le potentiel urbain et les
                  réalités immobilières pour accompagner les projets avec méthode.
                </p>
              </div>
            </div>
          </article>

          <article className={styles.emericCard}>
            <div className={styles.emericPortrait}>
              <Image
                alt="Emeric Legros"
                className={styles.emericImage}
                fill
                sizes="(max-width: 860px) 100vw, 28vw"
                src="/images/emeric-legros.png"
              />
            </div>
            <span>IA, Data & expérience digitale</span>
            <h3>Emeric Legros</h3>
            <p>
              Emeric développe les outils d’analyse, de projection et
              d’immersion 3D qui rendent les données immobilières plus simples à
              comprendre et à utiliser.
            </p>
          </article>
        </div>
      </section>

      <section className={styles.vision} aria-labelledby="vision-title">
        <div>
          <p className={styles.eyebrow}>Une vision à 360°</p>
          <h2 id="vision-title">Vendre avec justesse. Acheter avec projection.</h2>
        </div>
        <div className={styles.visionColumns}>
          <article>
            <Sparkles aria-hidden="true" />
            <h3>Pour une vente</h3>
            <p>
              Estimer le bien, comprendre son marché, identifier ses forces et
              présenter son potentiel pour créer une mise en vente cohérente.
            </p>
            <Link href="/estimation">Estimer mon bien <ArrowRight size={17} /></Link>
          </article>
          <article>
            <Building2 aria-hidden="true" />
            <h3>Pour un achat</h3>
            <p>
              Rechercher au bon endroit, mesurer la faisabilité et se projeter
              dans les usages et les transformations avant de s’engager.
            </p>
            <Link href="/recherche">Nous confier ma recherche <ArrowRight size={17} /></Link>
          </article>
        </div>
      </section>
    </main>
  );
}
