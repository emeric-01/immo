import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock3, Mail, MapPin, Phone } from "lucide-react";
import { createPageMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";
import { ContactForm } from "./ContactForm";
import styles from "./contact.module.css";

export const metadata: Metadata = createPageMetadata({
  title: "Contacter Les Jumelles Immo | Agence immobilière",
  description: "Contactez Les Jumelles Immo pour vendre, acheter ou estimer un bien. Écrivez-nous en ligne ou appelez directement notre agence immobilière.",
  path: "/contact",
});

const phoneDisplay = "06 19 82 19 84";
const phoneHref = "tel:+33619821984";
const email = "contact@jumellesimmo.fr";

export default function ContactPage() {
  const contactJsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contacter Les Jumelles Immo",
    url: absoluteUrl("/contact"),
    mainEntity: {
      "@type": "RealEstateAgent",
      name: "Les Jumelles Immo",
      telephone: "+33619821984",
      email,
      url: absoluteUrl("/"),
    },
  };

  return (
    <main className={styles.page}>
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd).replace(/</g, "\\u003c") }} type="application/ld+json" />
      <section className={styles.hero}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>Parlons de votre projet</p>
          <h1>Un échange simple peut tout clarifier.</h1>
          <p className={styles.lead}>Une question, un projet de vente ou une recherche ? Écrivez-nous ou appelez-nous directement. Vous échangez avec l’équipe des Jumelles Immo.</p>
          <div className={styles.directActions}>
            <a className={styles.phoneAction} href={phoneHref}><Phone aria-hidden="true" /><span><small>Appeler l’agence</small><strong>{phoneDisplay}</strong></span><ArrowRight aria-hidden="true" /></a>
            <a className={styles.emailAction} href={`mailto:${email}`}><Mail aria-hidden="true" /><span><small>Nous écrire</small><strong>{email}</strong></span></a>
          </div>
          <div className={styles.reassurance}>
            <div><Clock3 aria-hidden="true" /><span><strong>Réponse attentive</strong><small>Nous revenons vers vous rapidement.</small></span></div>
            <div><MapPin aria-hidden="true" /><span><strong>Expertise locale</strong><small>Aubagne, Aix, Cassis, Gémenos et alentours.</small></span></div>
          </div>
          <p className={styles.quickLinks}>Vous souhaitez aller directement à l’essentiel ? <Link href="/estimation">Estimer un bien</Link> ou <Link href="/recherche">déposer une recherche</Link>.</p>
        </div>
        <ContactForm />
      </section>
    </main>
  );
}
