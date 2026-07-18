import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ReceiptText, ShieldCheck } from "lucide-react";
import styles from "./honoraires.module.css";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({ title: "Honoraires de l’agence | Les Jumelles Immo", description: "Consultez le barème TTC des honoraires de transaction des Jumelles Immo pour les mandats simples et exclusifs.", path: "/honoraires" });

const feeRows = [
  {
    range: "Jusqu’à 150 000 €",
    simple: "8 000 € TTC",
    exclusive: "7 000 € TTC",
  },
  {
    range: "150 001 à 250 000 €",
    simple: "6 % TTC",
    exclusive: "5,5 % TTC",
  },
  {
    range: "250 001 à 500 000 €",
    simple: "5,5 % TTC",
    exclusive: "5 % TTC",
  },
  {
    range: "500 001 à 800 000 €",
    simple: "5 % TTC",
    exclusive: "4,5 % TTC",
  },
  {
    range: "Au-delà de 800 000 €",
    simple: "4,5 % TTC",
    exclusive: "4 % TTC",
  },
  {
    range: "Prestige / biens atypiques",
    simple: "Sur devis, maximum 5 %",
    exclusive: "Sur devis, maximum 4,5 %",
  },
];

export default function HonorairesPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="fees-title">
        <div>
          <p className={styles.eyebrow}>Barème de l’agence</p>
          <h1 id="fees-title">
            Des honoraires clairs, <em>annoncés dès le départ.</em>
          </h1>
          <p className={styles.heroIntro}>
            Une relation de confiance commence par une information simple et
            transparente. Retrouvez ici nos honoraires de transaction, exprimés
            toutes taxes comprises.
          </p>
        </div>

        <div className={styles.heroSummary} aria-label="Informations sur le barème">
          <ReceiptText aria-hidden="true" />
          <span>Transaction immobilière</span>
          <strong>Barème TTC</strong>
          <p>Mandat simple ou mandat exclusif, selon le prix de vente du bien.</p>
        </div>
      </section>

      <section className={styles.feesSection} aria-labelledby="table-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Honoraires de vente</p>
            <h2 id="table-title">Notre barème</h2>
          </div>
          <p>
            Le mandat exclusif bénéficie d’un barème spécifique, en contrepartie
            d’une stratégie de commercialisation entièrement pilotée par l’agence.
          </p>
        </div>

        <div className={styles.tableFrame}>
          <table>
            <caption>Barème TTC des honoraires de transaction</caption>
            <thead>
              <tr>
                <th scope="col">Prix de vente</th>
                <th scope="col">Mandat simple</th>
                <th scope="col">Mandat exclusif</th>
              </tr>
            </thead>
            <tbody>
              {feeRows.map((row) => (
                <tr key={row.range}>
                  <th scope="row">{row.range}</th>
                  <td data-label="Mandat simple">{row.simple}</td>
                  <td data-label="Mandat exclusif">{row.exclusive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.transparency} aria-labelledby="transparency-title">
        <div className={styles.transparencyTitle}>
          <ShieldCheck aria-hidden="true" />
          <div>
            <p className={styles.eyebrow}>Transparence</p>
            <h2 id="transparency-title">Ce qu’il faut retenir</h2>
          </div>
        </div>
        <div className={styles.notesGrid}>
          <article>
            <CheckCircle2 aria-hidden="true" />
            <h3>Des montants TTC</h3>
            <p>
              Les forfaits et pourcentages présentés dans ce barème sont exprimés
              toutes taxes comprises.
            </p>
          </article>
          <article>
            <CheckCircle2 aria-hidden="true" />
            <h3>Une information avant engagement</h3>
            <p>
              Le montant des honoraires et la partie qui en a la charge sont
              précisés dans le mandat et dans l’annonce du bien.
            </p>
          </article>
          <article>
            <CheckCircle2 aria-hidden="true" />
            <h3>Les biens hors standards</h3>
            <p>
              Pour les biens prestige ou atypiques, une proposition sur mesure
              est établie dans la limite du maximum indiqué.
            </p>
          </article>
        </div>
      </section>

      <section className={styles.cta} aria-labelledby="cta-title">
        <div>
          <p className={styles.eyebrow}>Votre projet</p>
          <h2 id="cta-title">Un bien à vendre ? Parlons de sa vraie valeur.</h2>
        </div>
        <Link href="/estimation">
          Demander une estimation <ArrowRight size={18} />
        </Link>
      </section>
    </main>
  );
}
