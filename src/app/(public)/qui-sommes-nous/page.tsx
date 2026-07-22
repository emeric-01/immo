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
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({ title: "Qui sommes-nous ? | Les Jumelles Immo", description: "Découvrez l’approche des Jumelles Immo : une estimation juste, une lecture urbanistique et un regard d’architecte pour révéler tout le potentiel de votre bien.", path: "/qui-sommes-nous", image: "/images/laure-severine-jumelles-immo.jpg" });

const expertises = [
  {
    icon: Scale,
    title: "Le prix juste",
    text: "Nous confrontons les caractéristiques du bien aux ventes réelles et à la dynamique locale. Pas de prix d’appel : une valeur argumentée et défendable.",
  },
  {
    icon: Building2,
    title: "Le potentiel du terrain",
    text: "Division parcellaire, extension, constructibilité : nous examinons les possibilités urbanistiques susceptibles de transformer la lecture du bien.",
  },
  {
    icon: DraftingCompass,
    title: "Les m² qui comptent",
    text: "Circulations, volumes, lumière, agrandissement : nous cherchons comment mieux utiliser l’existant et créer des espaces de vie qui donnent envie.",
  },
  {
    icon: Sparkles,
    title: "La mise en désir",
    text: "Un acheteur doit comprendre le bien, mais aussi s’y projeter. Nous construisons une présentation qui révèle ses qualités sans masquer sa réalité.",
  },
];

const interiorProjects = [
  {
    eyebrow: "Villa en Provence",
    title: "Du sur-mesure pour révéler les volumes",
    text: "Claustras, rangements intégrés, lumière et mobilier dessiné pour le lieu : l’aménagement donne une lecture plus fluide et plus singulière de la maison.",
    images: [
      {
        src: "/images/about/amenagement-villa-bibliotheque.webp",
        alt: "Bibliothèque sur mesure rétroéclairée dans une villa en Provence",
      },
      {
        src: "/images/about/amenagement-villa-provence.webp",
        alt: "Pièce de vie réaménagée avec claustra en bois et mobilier intégré",
      },
    ],
  },
  {
    eyebrow: "Appartement témoin",
    title: "Créer la projection sans travestir le bien",
    text: "Une circulation lisible, des fonctions clairement installées et une décoration juste permettent aux visiteurs de comprendre immédiatement comment habiter l’espace.",
    images: [
      {
        src: "/images/about/appartement-temoin-piece-de-vie.webp",
        alt: "Pièce de vie lumineuse aménagée en appartement témoin",
      },
      {
        src: "/images/about/appartement-temoin-chambre.webp",
        alt: "Chambre mise en scène dans un appartement témoin",
      },
    ],
  },
  {
    eyebrow: "Meublé touristique",
    title: "Donner une identité à un bien d’investissement",
    text: "L’architecture intérieure aide aussi à positionner un bien après l’achat : cohérence des ambiances, usages optimisés et personnalité mémorable pour mieux le valoriser.",
    images: [
      {
        src: "/images/about/meuble-touristique-piece-de-vie.webp",
        alt: "Pièce de vie aménagée dans un meublé touristique au Castellet",
      },
      {
        src: "/images/about/meuble-touristique-chambre.webp",
        alt: "Chambre chaleureuse aménagée dans un meublé touristique",
      },
    ],
  },
];

export default function QuiSommesNousPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="about-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Qui sommes-nous ?</p>
          <h1 id="about-title">
            Votre bien a une histoire. <em>Nous révélons sa valeur.</em>
          </h1>
          <p className={styles.heroIntro}>
            Notre ambition n’est pas de vous promettre le prix le plus haut.
            C’est de défendre le meilleur prix que le marché peut réellement
            porter, en examinant tout ce qui rend votre bien unique — aujourd’hui
            et demain.
          </p>
          <div className={styles.heroTags} aria-label="Notre promesse">
            <span>Une estimation sincère</span>
            <span>Un potentiel révélé</span>
            <span>Une vente mieux préparée</span>
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
          <p className={styles.eyebrow}>Deux regards, un même bien</p>
          <h2 id="story-title">Là où certains voient une maison, nous voyons des possibilités.</h2>
          <blockquote>
            « Pas de promesse gonflée pour décrocher un mandat. Une stratégie
            concrète pour aller chercher la meilleure valeur réelle. »
          </blockquote>
        </div>
        <div className={styles.storyText}>
          <p>
            Devant une même maison, nous ne regardons jamais tout à fait la même
            chose. Séverine observe la parcelle, le PLU, les règles et les droits
            à construire. Elle se demande si le terrain peut être divisé, si une
            extension est envisageable ou si un potentiel invisible peut changer
            la valeur du projet.
          </p>
          <p>
            Laure entre dans le bien et imagine aussitôt une autre circulation,
            une pièce de vie plus généreuse, des mètres carrés mieux utilisés ou
            un agrandissement qui change tout. Elle ne cherche pas à maquiller le
            lieu : elle donne à voir ce qu’il pourrait devenir, avec des idées
            réalistes et désirables.
          </p>
          <p>
            C’est de cette double lecture qu’est née Les Jumelles Immo. Deux
            sœurs, une expertise immobilière commune et une conviction : pour
            bien vendre, il faut d’abord comprendre tout ce que l’on vend. Le
            prix, bien sûr, mais aussi les usages, le foncier, les possibilités
            d’évolution et l’émotion que le bien peut provoquer.
          </p>
        </div>
      </section>

      <section className={styles.projectsSection} aria-labelledby="projects-title">
        <div className={styles.projectsIntro}>
          <div>
            <p className={styles.eyebrow}>La preuve par les espaces</p>
            <h2 id="projects-title">Imaginer, aménager, mieux valoriser.</h2>
          </div>
          <p>
            Avant une vente, après une acquisition ou pour repositionner un
            investissement, notre regard ne s’arrête pas à l’état existant. Ces
            réalisations montrent comment une intention juste peut révéler les
            volumes, clarifier les usages et renforcer le désir d’habiter.
          </p>
        </div>

        <div className={styles.projectsGrid}>
          {interiorProjects.map((project, projectIndex) => (
            <article className={styles.projectCard} key={project.title}>
              <div className={styles.projectGallery}>
                {project.images.map((image, imageIndex) => (
                  <figure
                    className={imageIndex === 0 ? styles.projectImageMain : styles.projectImageDetail}
                    key={image.src}
                  >
                    <Image
                      alt={image.alt}
                      className={styles.coverImage}
                      fill
                      quality={78}
                      sizes={projectIndex === 0
                        ? "(max-width: 760px) 88vw, (max-width: 1100px) 42vw, 31vw"
                        : "(max-width: 760px) 88vw, (max-width: 1100px) 42vw, 22vw"}
                      src={image.src}
                    />
                  </figure>
                ))}
              </div>
              <div className={styles.projectCopy}>
                <span>{project.eyebrow}</span>
                <h3>{project.title}</h3>
                <p>{project.text}</p>
              </div>
            </article>
          ))}
        </div>

        <aside className={styles.projectsNote}>
          <DraftingCompass aria-hidden="true" />
          <p>
            <strong>Une double compétence, au service de la décision.</strong>
            Le regard immobilier mesure la valeur de marché. Le regard
            d’architecte révèle ce qui peut être amélioré, transformé ou mieux
            raconté — avec des propositions réalistes, jamais artificielles.
          </p>
        </aside>
      </section>

      <section className={styles.expertiseSection} aria-labelledby="expertise-title">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>Révéler avant de vendre</p>
          <h2 id="expertise-title">La valeur n’est pas un chiffre posé sur une annonce.</h2>
          <p>
            Elle se construit à partir du marché, mais aussi de tous les leviers
            propres au bien. Notre méthode les met à plat pour choisir la bonne
            stratégie, sans surévaluer et sans passer à côté d’une opportunité.
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
          <p className={styles.eyebrow}>Les Jumelles Immo</p>
          <h2 id="team-title">L’immobilier au croisement du marché et du possible.</h2>
        </div>

        <div className={styles.teamGrid}>
          <article className={styles.sistersCard}>
            <div className={styles.sistersProfiles}>
              <section className={styles.profileRow} aria-labelledby="laure-profile-title">
                <div className={styles.profilePortrait}>
                  <Image
                    alt="Portrait de Laure Masfrand, cofondatrice des Jumelles Immo"
                    className={styles.coverImage}
                    fill
                    sizes="(max-width: 760px) 42vw, 210px"
                    src="/images/laure-masfrand-jumelles-immo.webp"
                  />
                </div>
                <div className={styles.profileCopy}>
                  <span>Architecture intérieure & potentiel d’usage</span>
                  <h3 id="laure-profile-title">Laure Masfrand</h3>
                  <p>
                    Formée à l’École Boulle, Laure repère les mètres carrés mal
                    exploités, imagine des volumes plus fluides et transforme les
                    contraintes du lieu en scénarios capables de séduire.
                  </p>
                </div>
              </section>
              <section className={styles.profileRow} aria-labelledby="severine-profile-title">
                <div className={styles.profilePortrait}>
                  <Image
                    alt="Portrait de Séverine Masfrand, cofondatrice des Jumelles Immo"
                    className={styles.coverImage}
                    fill
                    sizes="(max-width: 760px) 42vw, 210px"
                    src="/images/severine-masfrand-jumelles-immo.webp"
                  />
                </div>
                <div className={styles.profileCopy}>
                  <span>Immobilier, droit & urbanisme</span>
                  <h3 id="severine-profile-title">Séverine Masfrand</h3>
                  <p>
                    Séverine relie la réalité du marché au cadre urbanistique. Son
                    regard révèle les possibilités foncières et sécurise une
                    stratégie de vente solide, précise et argumentée.
                  </p>
                </div>
              </section>
            </div>
          </article>

          <aside className={styles.dataNote} aria-labelledby="data-title">
            <span className={styles.dataIcon} aria-hidden="true"><BrainCircuit /></span>
            <p className={styles.eyebrow}>La technologie en renfort</p>
            <h3 id="data-title">Plus de données. Moins de discours creux.</h3>
            <p>
              Nous croisons les données de transactions, les dynamiques locales
              et les caractéristiques du bien. L’IA nous aide à challenger nos
              analyses, à détecter des écarts et à explorer plus vite différents
              scénarios de valorisation.
            </p>
            <strong>
              La technologie ne décide jamais à notre place : elle rend notre
              conseil plus documenté, plus réactif et plus juste.
            </strong>
          </aside>
        </div>
      </section>

      <section className={styles.vision} aria-labelledby="vision-title">
        <div>
          <p className={styles.eyebrow}>Notre promesse</p>
          <h2 id="vision-title">Pas de prix gonflé. Une valeur révélée.</h2>
          <Link className={styles.visionCta} href="/estimation">
            Découvrir le potentiel de mon bien <ArrowRight size={18} />
          </Link>
        </div>
        <div className={styles.visionColumns}>
          <article>
            <Scale aria-hidden="true" />
            <h3>Une estimation que l’on peut défendre</h3>
            <p>
              Un prix cohérent avec le marché, expliqué par des faits et enrichi
              par une lecture complète du bien. Vous savez où vous allez — et
              pourquoi.
            </p>
          </article>
          <article>
            <Sparkles aria-hidden="true" />
            <h3>Une stratégie qui crée l’envie</h3>
            <p>
              Nous ne vendons pas seulement une surface. Nous racontons les
              usages, les évolutions et la vie possible dans le lieu pour que les
              bons acheteurs puissent réellement s’y projeter.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
