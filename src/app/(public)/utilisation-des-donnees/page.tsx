import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Building2,
  Check,
  Database,
  FileSearch,
  Home,
  LockKeyhole,
  Mail,
  Search,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { createPageMetadata } from "@/lib/seo";
import styles from "./utilisation-des-donnees.module.css";

export const metadata: Metadata = createPageMetadata({
  title: "Utilisation de vos données | Les Jumelles Immo",
  description:
    "Découvrez comment Les Jumelles Immo utilise et protège les données transmises lors d’une recherche immobilière ou d’une estimation.",
  path: "/utilisation-des-donnees",
});

const updatedAt = "25 juillet 2026";

export default function DataUsePage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="data-use-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Données personnelles</p>
          <h1 id="data-use-title">
            Vos données servent <em>votre projet.</em>
          </h1>
          <p className={styles.intro}>
            Lorsque vous nous confiez une recherche ou demandez une estimation,
            nous utilisons uniquement les informations nécessaires pour comprendre
            votre projet, vous répondre et assurer son suivi.
          </p>
          <p className={styles.updated}>Dernière mise à jour : {updatedAt}</p>
        </div>
        <aside className={styles.promise} aria-label="Nos engagements">
          <ShieldCheck aria-hidden="true" />
          <p>Notre engagement</p>
          <strong>Un accès limité aux personnes qui accompagnent votre projet.</strong>
          <ul>
            <li><Check aria-hidden="true" /> Données jamais vendues ni louées</li>
            <li><Check aria-hidden="true" /> Utilisation liée à votre demande</li>
            <li><Check aria-hidden="true" /> Droits accessibles à tout moment</li>
          </ul>
        </aside>
      </section>

      <nav className={styles.summary} aria-label="Sommaire">
        <a href="#responsable">Responsable</a>
        <a href="#utilisations">Utilisations</a>
        <a href="#acces">Personnes habilitées</a>
        <a href="#conservation">Conservation</a>
        <a href="#droits">Vos droits</a>
      </nav>

      <div className={styles.content}>
        <section className={styles.section} id="responsable" aria-labelledby="responsable-title">
          <SectionHeading icon={Building2} number="01" id="responsable-title">
            Qui est responsable de vos données&nbsp;?
          </SectionHeading>
          <div className={styles.identityCard}>
            <div>
              <p className={styles.label}>Responsable du traitement et éditeur du site</p>
              <h3>Agence Séverine Masfrand — ASM</h3>
              <p>
                Société éditrice du site <strong>jumellesimmo.fr</strong>, située
                595 route des Aubes, 13400 Aubagne.
              </p>
            </div>
            <a href="mailto:contact@jumellesimmo.fr">
              <Mail aria-hidden="true" /> contact@jumellesimmo.fr
            </a>
          </div>
        </section>

        <section className={styles.section} id="utilisations" aria-labelledby="utilisations-title">
          <SectionHeading icon={Database} number="02" id="utilisations-title">
            À quoi servent les informations demandées&nbsp;?
          </SectionHeading>
          <p className={styles.sectionIntro}>
            Les informations collectées dépendent de la démarche que vous engagez.
            Les champs obligatoires sont signalés dans les formulaires : sans eux,
            nous ne pouvons pas enregistrer ou suivre correctement la demande.
          </p>
          <div className={styles.useGrid}>
            <article>
              <div className={styles.useIcon}><Search aria-hidden="true" /></div>
              <p className={styles.label}>Recherche immobilière</p>
              <h3>Trouver les biens adaptés à vos critères</h3>
              <p>
                Votre identité, vos coordonnées, les villes recherchées, votre
                budget, les caractéristiques du bien et vos priorités nous permettent
                d’enregistrer votre recherche, de sélectionner des biens pertinents
                et de vous contacter selon les canaux que vous avez choisis.
              </p>
            </article>
            <article>
              <div className={styles.useIcon}><Home aria-hidden="true" /></div>
              <p className={styles.label}>Estimation et projet de vente</p>
              <h3>Produire un premier repère puis affiner l’analyse</h3>
              <p>
                L’adresse, le type de bien, sa surface et ses caractéristiques servent
                à calculer et enregistrer une première estimation, à préparer une
                étude plus détaillée et, si vous le demandez, à organiser un échange
                ou une visite d’estimation.
              </p>
            </article>
          </div>
          <div className={styles.humanNote}>
            <FileSearch aria-hidden="true" />
            <div>
              <strong>La donnée fournit un repère, pas une décision automatique.</strong>
              <p>
                Une estimation en ligne reste indicative. Elle n’a aucun effet juridique
                et peut être complétée par l’analyse humaine du bien, de son état, de son
                environnement et de son potentiel.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.section} id="acces" aria-labelledby="access-title">
          <SectionHeading icon={UserRoundCheck} number="03" id="access-title">
            Qui peut accéder à vos données&nbsp;?
          </SectionHeading>
          <div className={styles.accessGrid}>
            <article>
              <span>Au sein de l’agence</span>
              <h3>Les personnes habilitées</h3>
              <p>
                Séverine Masfrand, les salariés de l’Agence Séverine Masfrand et les
                personnes qu’elle missionne, notamment les agents commerciaux, peuvent
                accéder aux seules informations utiles au suivi du projet qui leur est confié.
              </p>
            </article>
            <article>
              <span>Services nécessaires</span>
              <h3>Les prestataires techniques</h3>
              <p>
                Les prestataires d’hébergement, de base de données, d’authentification,
                d’envoi d’e-mails ou de données immobilières peuvent traiter les éléments
                strictement nécessaires au fonctionnement du service, pour le compte de l’agence.
              </p>
            </article>
          </div>
          <p className={styles.accessRule}>
            Ces accès sont limités aux missions confiées et soumis à des obligations de
            confidentialité et de sécurité. Vos informations ne peuvent pas être utilisées
            à titre personnel et ne sont jamais vendues ni louées à des tiers.
          </p>
        </section>

        <section className={styles.section} id="conservation" aria-labelledby="retention-title">
          <SectionHeading icon={LockKeyhole} number="04" id="retention-title">
            Sur quelles bases et pendant combien de temps&nbsp;?
          </SectionHeading>
          <div className={styles.factsGrid}>
            <article>
              <span>Pourquoi le traitement est permis</span>
              <h3>Bases légales</h3>
              <p>
                Les démarches demandées avant un éventuel contrat permettent de traiter
                les informations nécessaires à la recherche ou à l’estimation. Votre
                consentement s’applique aux communications et canaux de contact qui le
                nécessitent. La sécurité du site repose également sur l’intérêt légitime
                de l’agence à protéger ses services.
              </p>
            </article>
            <article>
              <span>Prospects et demandes</span>
              <h3>Durée de conservation</h3>
              <p>
                Les données d’un prospect sont conservées au maximum trois ans à compter
                de leur collecte ou du dernier contact actif de sa part. Certaines données
                peuvent ensuite être archivées pendant les délais légaux lorsqu’elles sont
                nécessaires à la preuve d’un échange, à un contrat ou à une obligation réglementaire.
              </p>
            </article>
          </div>
        </section>

        <section className={styles.rights} id="droits" aria-labelledby="rights-title">
          <div>
            <p className={styles.eyebrow}>05 — Gardez le contrôle</p>
            <h2 id="rights-title">Vous pouvez agir sur vos données.</h2>
            <p>
              Vous pouvez demander l’accès, la rectification, l’effacement, la limitation
              ou la portabilité de vos données, vous opposer à certains traitements et
              retirer votre consentement à tout moment lorsqu’il constitue la base du traitement.
            </p>
          </div>
          <div className={styles.rightsActions}>
            <a href="mailto:contact@jumellesimmo.fr?subject=Exercice%20de%20mes%20droits%20sur%20mes%20donn%C3%A9es">
              Exercer mes droits <ArrowRight aria-hidden="true" />
            </a>
            <Link href="/mentions-legales">
              Consulter les mentions légales
            </Link>
            <a href="https://www.cnil.fr/fr/les-droits-pour-maitriser-vos-donnees-personnelles" rel="noreferrer" target="_blank">
              Saisir la CNIL en cas de difficulté
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}

function SectionHeading({
  children,
  icon: Icon,
  id,
  number,
}: {
  children: ReactNode;
  icon: typeof ShieldCheck;
  id: string;
  number: string;
}) {
  return (
    <div className={styles.sectionHeading}>
      <span><Icon aria-hidden="true" /></span>
      <div>
        <p>{number}</p>
        <h2 id={id}>{children}</h2>
      </div>
    </div>
  );
}
