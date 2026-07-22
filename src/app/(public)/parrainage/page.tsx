import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Check,
  Euro,
  Handshake,
  HeartHandshake,
  ShieldCheck,
  UserRoundPlus,
} from "lucide-react";
import { absoluteUrl } from "@/lib/site";
import { createPageMetadata } from "@/lib/seo";
import { getClientSession } from "@/lib/client-access/auth";
import { ReferralForm } from "./ReferralForm";
import styles from "./parrainage.module.css";

export const metadata: Metadata = createPageMetadata({
  title: "Parrainage immobilier : 500 € offerts | Les Jumelles Immo",
  description:
    "Recommandez un proche qui souhaite vendre ou acheter un bien avec Les Jumelles Immo et recevez 500 € si sa transaction aboutit.",
  image: "/images/local-agency/maison-contemporaine-jardin.jpg",
  path: "/parrainage",
});

const steps = [
  {
    icon: UserRoundPlus,
    number: "01",
    title: "Vous nous présentez votre proche",
    text: "Transmettez-nous ses coordonnées avec son accord et quelques informations sur son projet.",
  },
  {
    icon: HeartHandshake,
    number: "02",
    title: "Nous l’accompagnons",
    text: "Une Jumelle le contacte, étudie son projet et reste à ses côtés jusqu’à sa concrétisation.",
  },
  {
    icon: Euro,
    number: "03",
    title: "Vous recevez 500 €",
    text: "La prime est versée par virement après la signature de l’acte authentique et l’encaissement de nos honoraires.",
  },
];

const faqs = [
  {
    question: "Qui puis-je parrainer ?",
    answer:
      "Un ami, un collègue ou un membre de votre famille majeur qui souhaite vendre ou acheter un bien et qui n’est pas déjà accompagné par Les Jumelles Immo pour ce même projet.",
  },
  {
    question: "Quand la prime de 500 € est-elle versée ?",
    answer:
      "Elle devient due si la transaction présentée est conclue par notre agence. Le virement intervient dans les 60 jours suivant la signature de l’acte authentique, après encaissement de nos honoraires.",
  },
  {
    question: "Puis-je parrainer plusieurs personnes ?",
    answer:
      "Oui, dans la limite de deux parrainages par période de 12 mois. Lorsqu’un même projet est présenté plusieurs fois, le premier parrainage validé est retenu.",
  },
  {
    question: "Comment les coordonnées sont-elles utilisées ?",
    answer:
      "Elles servent uniquement à traiter le parrainage et à échanger sur le projet immobilier présenté. Elles ne sont jamais revendues.",
  },
];

export const dynamic = "force-dynamic";

export default async function ParrainagePage() {
  const clientSession = await getClientSession();
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
      name: faq.question,
    })),
  };

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Programme de parrainage immobilier Les Jumelles Immo",
    provider: { "@id": `${absoluteUrl("/")}#organization` },
    serviceType: "Parrainage immobilier",
    url: absoluteUrl("/parrainage"),
  };

  return (
    <main className={styles.page}>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify([serviceJsonLd, faqJsonLd]).replace(/</g, "\\u003c") }}
        type="application/ld+json"
      />

      <section className={styles.hero} aria-labelledby="referral-title">
        <Image
          alt="Maison contemporaine avec jardin, projet immobilier accompagné par Les Jumelles Immo"
          className={styles.heroImage}
          fill
          priority
          quality={78}
          sizes="100vw"
          src="/images/local-agency/maison-contemporaine-jardin.jpg"
        />
        <div className={styles.heroOverlay} />
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Parrainage immobilier</p>
          <h1 id="referral-title">Un projet partagé.<br /><em>500 € pour vous remercier.</em></h1>
          <p className={styles.heroIntro}>
            Un proche souhaite vendre ou acheter un bien ? Présentez-le aux
            Jumelles et recevez 500 € lorsque sa transaction aboutit avec nous.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryAction} href="#formulaire">
              Parrainer un proche <ArrowRight aria-hidden="true" />
            </Link>
            <Link className={styles.secondaryAction} href="#fonctionnement">
              Comment ça marche ? <ArrowDown aria-hidden="true" />
            </Link>
          </div>
          <ul className={styles.heroProofs}>
            <li><Check aria-hidden="true" /> Formulaire en 2 minutes</li>
            <li><Check aria-hidden="true" /> Données confidentielles</li>
            <li><Check aria-hidden="true" /> Prime versée par virement</li>
          </ul>
        </div>
        <div className={styles.reward} aria-label="Prime de parrainage de 500 euros">
          <span>Votre prime</span>
          <strong>500 €</strong>
          <small>si la transaction est signée</small>
        </div>
      </section>

      <section className={styles.intro} aria-labelledby="intro-title">
        <div>
          <p className={styles.eyebrow}>Une recommandation qui compte</p>
          <h2 id="intro-title">Vous créez la rencontre.<br />Nous prenons soin du projet.</h2>
        </div>
        <div className={styles.introText}>
          <p>
            Recommander une agence, c’est engager sa confiance. Nous prenons le
            relais avec la même attention que si vous nous confiiez votre propre
            projet : écoute, conseil clair et suivi régulier.
          </p>
          <p>
            Votre proche reste totalement libre de poursuivre ou non. Votre
            parrainage est validé après vérification de son éligibilité, puis
            suivi jusqu’à la signature.
          </p>
        </div>
      </section>

      <section className={styles.steps} id="fonctionnement" aria-labelledby="steps-title">
        <header className={styles.sectionHeading}>
          <p className={styles.eyebrow}>Le fonctionnement</p>
          <h2 id="steps-title">Trois étapes, simplement.</h2>
        </header>
        <ol>
          {steps.map(({ icon: Icon, number, text, title }) => (
            <li key={number}>
              <div className={styles.stepTop}>
                <span className={styles.stepIcon}><Icon aria-hidden="true" /></span>
                <b>{number}</b>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.formSection} id="formulaire" aria-labelledby="form-title">
        <div className={styles.formIntro}>
          <p className={styles.eyebrow}>Présenter un projet</p>
          <h2 id="form-title">Parlez-nous de votre proche.</h2>
          <p>
            Quelques informations suffisent pour que nous puissions le contacter
            avec tact et comprendre son projet.
          </p>
          <div className={styles.formTrust}>
            <ShieldCheck aria-hidden="true" />
            <div>
              <strong>Sa confiance reste la priorité.</strong>
              <span>Assurez-vous d’avoir son accord avant de nous transmettre ses coordonnées.</span>
            </div>
          </div>
          <ul>
            <li><Check aria-hidden="true" /> Réponse rapide de notre équipe</li>
            <li><Check aria-hidden="true" /> Aucun engagement pour votre proche</li>
            <li><Check aria-hidden="true" /> Suivi de votre parrainage par l’agence</li>
          </ul>
        </div>
        <ReferralForm sponsor={clientSession ? {
          email: clientSession.email,
          firstName: clientSession.firstName,
          lastName: clientSession.lastName,
          phone: clientSession.phone,
        } : null} />
      </section>

      <section className={styles.conditions} aria-labelledby="conditions-title">
        <div className={styles.conditionsLead}>
          <Handshake aria-hidden="true" />
          <div>
            <p className={styles.eyebrow}>Des règles transparentes</p>
            <h2 id="conditions-title">Les conditions essentielles.</h2>
          </div>
        </div>
        <div className={styles.conditionGrid}>
          <p><strong>Éligibilité.</strong> Le parrain est une personne physique majeure agissant à titre personnel. L’auto-parrainage et le parrainage rétroactif ne sont pas admis.</p>
          <p><strong>Projet présenté.</strong> Votre proche ne doit pas avoir été en relation avec Les Jumelles Immo pour ce même projet au cours des 12 derniers mois.</p>
          <p><strong>Validation.</strong> Un proche ne peut avoir qu’un seul parrain. Si plusieurs demandes existent, la première demande complète et éligible est retenue.</p>
          <p><strong>Versement.</strong> La prime de 500 € est versée après l’acte authentique et l’encaissement de nos honoraires, dans un délai maximal de 60 jours.</p>
        </div>
        <details>
          <summary>Lire les modalités complémentaires</summary>
          <div>
            <p>Le programme est limité à deux parrainages par personne et par période de 12 mois. Le filleul reste libre de donner suite ou non à l’accompagnement proposé par l’agence.</p>
            <p>Les Jumelles Immo peuvent vérifier l’éligibilité, accepter ou refuser une recommandation et faire évoluer le programme. Toute modification reste sans incidence sur les parrainages déjà validés.</p>
            <p>Les informations sont utilisées uniquement pour traiter la recommandation, accompagner le projet et gérer le versement éventuel de la prime. Elles sont conservées pendant la relation commerciale puis au maximum trois ans.</p>
          </div>
        </details>
      </section>

      <section className={styles.faq} aria-labelledby="faq-title">
        <header className={styles.sectionHeading}>
          <p className={styles.eyebrow}>Questions fréquentes</p>
          <h2 id="faq-title">Avant de faire les présentations.</h2>
        </header>
        <div className={styles.faqList}>
          {faqs.map((faq) => (
            <details key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={styles.finalCta} aria-labelledby="final-title">
        <div>
          <p className={styles.eyebrow}>Une personne en tête ?</p>
          <h2 id="final-title">Faites simplement les présentations.</h2>
        </div>
        <Link href="#formulaire">Démarrer mon parrainage <ArrowRight aria-hidden="true" /></Link>
      </section>
    </main>
  );
}
