import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Check,
  Compass,
  GraduationCap,
  Handshake,
  HeartHandshake,
  MessageCircleMore,
  Rocket,
  UsersRound,
} from "lucide-react";
import { createPageMetadata } from "@/lib/seo";
import styles from "./nous-rejoindre.module.css";

export const metadata: Metadata = createPageMetadata({
  title: "Devenir agent commercial immobilier | Les Jumelles Immo",
  description:
    "Rejoignez Les Jumelles Immo et développez votre activité d’agent commercial avec une méthode, des outils, des données locales et un accompagnement humain.",
  path: "/nous-rejoindre",
  image: "/images/conseiller-immobilier-recrutement.jpg",
});

const support = [
  {
    icon: Compass,
    label: "Démarrage",
    title: "Un cap clair dès le début",
    text: "Nous construisons ensemble votre secteur, vos objectifs et un plan d’action réaliste. Vous savez quoi faire, dans quel ordre et pourquoi.",
  },
  {
    icon: GraduationCap,
    label: "Progression",
    title: "Une méthode qui se transmet",
    text: "Prospection, estimation, rendez-vous vendeur, suivi acquéreur : nous partageons nos pratiques et travaillons les situations réelles avec vous.",
  },
  {
    icon: BarChart3,
    label: "Outils",
    title: "Des décisions mieux documentées",
    text: "Données de marché, ventes comparables, pages locales et supports de présentation renforcent votre conseil et votre crédibilité sur le terrain.",
  },
  {
    icon: HeartHandshake,
    label: "Collectif",
    title: "De l’autonomie, jamais de l’isolement",
    text: "Vous organisez votre activité librement, avec une équipe disponible pour challenger un prix, préparer un mandat ou débloquer un dossier.",
  },
];

const steps = [
  ["01", "Premier échange", "Nous parlons de votre parcours, de votre secteur et de ce que vous souhaitez construire."],
  ["02", "Plan de lancement", "Nous posons vos priorités commerciales, vos outils et vos premiers objectifs."],
  ["03", "Prise en main", "Vous découvrez la méthode, les supports et le fonctionnement de l’agence."],
  ["04", "Développement", "Des points réguliers vous aident à progresser et à faire grandir durablement votre activité."],
];

export default function NousRejoindrePage() {
  const contactHref =
    "mailto:contact@jumellesimmo.fr?subject=Candidature%20agent%20commercial%20-%20Les%20Jumelles%20Immo";

  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="join-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Rejoindre Les Jumelles Immo</p>
          <h1 id="join-title">
            Votre indépendance. <em>Notre énergie collective.</em>
          </h1>
          <p className={styles.heroIntro}>
            Entreprendre dans l’immobilier sans avancer seul : développez votre
            activité avec une méthode claire, des outils utiles et une équipe
            réellement présente à vos côtés.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.primaryCta} href={contactHref}>
              Échanger avec nous <ArrowRight aria-hidden="true" />
            </a>
            <Link className={styles.secondaryCta} href="#accompagnement">
              Découvrir l’accompagnement
            </Link>
          </div>
          <ul className={styles.heroProofs}>
            <li><Check aria-hidden="true" /> Autonomie d’organisation</li>
            <li><Check aria-hidden="true" /> Accompagnement personnalisé</li>
            <li><Check aria-hidden="true" /> Outils et expertise locale</li>
          </ul>
        </div>

        <figure className={styles.heroVisual}>
          <Image
            alt="Conseiller immobilier arrivant pour une visite dans une propriété méditerranéenne"
            fill
            priority
            sizes="(max-width: 860px) 100vw, 46vw"
            src="/images/conseiller-immobilier-recrutement.jpg"
          />
          <figcaption>
            <span>Conseiller immobilier indépendant</span>
            <strong>Votre terrain, notre accompagnement.</strong>
          </figcaption>
        </figure>
      </section>

      <section className={styles.manifesto} aria-labelledby="manifesto-title">
        <div>
          <p className={styles.eyebrow}>Notre philosophie</p>
          <h2 id="manifesto-title">Faire grandir les personnes, pas seulement les chiffres.</h2>
        </div>
        <div className={styles.manifestoText}>
          <p>
            Nous croyons à un immobilier précis, humain et transparent. Chez
            Les Jumelles Immo, chaque agent commercial construit sa propre
            activité, tout en profitant d’un cadre exigeant et bienveillant.
          </p>
          <p>
            Ici, pas de compétition interne ni de discours standardisé. Nous
            partageons les informations, les expériences et les bonnes pratiques
            pour délivrer un conseil de qualité à chaque client.
          </p>
        </div>
      </section>

      <section className={styles.supportSection} id="accompagnement" aria-labelledby="support-title">
        <header className={styles.sectionHeading}>
          <p className={styles.eyebrow}>Votre accompagnement</p>
          <h2 id="support-title">Tout ce qu’il faut pour avancer avec confiance.</h2>
          <p>Des réponses concrètes, des outils simples et des échanges réguliers, au rythme de votre développement.</p>
        </header>
        <div className={styles.supportGrid}>
          {support.map(({ icon: Icon, label, title, text }, index) => (
            <article key={title}>
              <div className={styles.cardTop}>
                <span className={styles.iconBadge}><Icon aria-hidden="true" /></span>
                <small>0{index + 1} · {label}</small>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.movement} aria-labelledby="movement-title">
        <div className={styles.movementIntro}>
          <span className={styles.movementIcon}><Rocket aria-hidden="true" /></span>
          <p className={styles.eyebrow}>Une société qui bouge</p>
          <h2 id="movement-title">Nous construisons l’agence de demain, aujourd’hui.</h2>
          <p>
            Nouveaux outils, données locales, contenus de qualité, méthodes de
            vente plus lisibles : l’agence évolue en permanence et chacun peut
            contribuer à cette dynamique.
          </p>
        </div>
        <div className={styles.movementPoints}>
          <article><BarChart3 aria-hidden="true" /><div><strong>La donnée au service du conseil</strong><span>Des estimations mieux argumentées et une lecture plus fine des secteurs.</span></div></article>
          <article><MessageCircleMore aria-hidden="true" /><div><strong>Des idées qui circulent</strong><span>Les retours terrain nourrissent nos outils, nos supports et notre manière de travailler.</span></div></article>
          <article><UsersRound aria-hidden="true" /><div><strong>Une croissance choisie</strong><span>Nous privilégions des profils engagés et une équipe où chacun reste connu et accompagné.</span></div></article>
        </div>
      </section>

      <section className={styles.journey} aria-labelledby="journey-title">
        <header className={styles.sectionHeading}>
          <p className={styles.eyebrow}>Votre arrivée</p>
          <h2 id="journey-title">Un parcours d’intégration simple et concret.</h2>
        </header>
        <ol>
          {steps.map(([number, title, text]) => (
            <li key={number}>
              <span>{number}</span>
              <div><h3>{title}</h3><p>{text}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.profile} aria-labelledby="profile-title">
        <div className={styles.profileLead}>
          <p className={styles.eyebrow}>Et si c’était vous ?</p>
          <h2 id="profile-title">Nous cherchons des personnalités, pas des profils formatés.</h2>
          <p>
            Une expérience dans l’immobilier est bienvenue, mais la qualité de
            la relation, la fiabilité et l’envie d’apprendre comptent tout autant.
          </p>
        </div>
        <div className={styles.profileDetails}>
          <ul>
            <li><Handshake aria-hidden="true" /> Vous aimez créer une relation de confiance</li>
            <li><BriefcaseBusiness aria-hidden="true" /> Vous avez l’esprit entrepreneurial</li>
            <li><Compass aria-hidden="true" /> Vous connaissez ou souhaitez développer un secteur local</li>
            <li><GraduationCap aria-hidden="true" /> Vous êtes curieux, rigoureux et prêt à progresser</li>
          </ul>
          <p>Agent expérimenté, professionnel en reconversion ou personnalité fortement implantée localement : commençons par nous rencontrer.</p>
        </div>
      </section>

      <section className={styles.finalCta} aria-labelledby="cta-title">
        <div>
          <p className={styles.eyebrow}>Parlons de votre projet</p>
          <h2 id="cta-title">Envie de construire la suite avec nous ?</h2>
          <p>Un premier échange simple, confidentiel et sans engagement.</p>
        </div>
        <a href={contactHref}>Contacter les Jumelles <ArrowRight aria-hidden="true" /></a>
      </section>
    </main>
  );
}
