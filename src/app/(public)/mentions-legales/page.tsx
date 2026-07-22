import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  Database,
  ExternalLink,
  FileText,
  LockKeyhole,
  Mail,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { createPageMetadata } from "@/lib/seo";
import styles from "./mentions-legales.module.css";

export const metadata: Metadata = createPageMetadata({
  title: "Mentions légales et confidentialité | Les Jumelles Immo",
  description:
    "Mentions légales, protection des données personnelles et conditions d’utilisation du site Les Jumelles Immo.",
  path: "/mentions-legales",
});

const updatedAt = "22 juillet 2026";

export default function LegalNoticePage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="legal-title">
        <div>
          <p className={styles.eyebrow}>Informations juridiques</p>
          <h1 id="legal-title">Mentions légales <em>&amp; confidentialité</em></h1>
          <p className={styles.intro}>
            Nous vous expliquons simplement qui édite ce site, comment il est
            hébergé et de quelle manière vos données sont utilisées et protégées.
          </p>
          <p className={styles.updated}>Dernière mise à jour : {updatedAt}</p>
        </div>
        <div className={styles.heroCard}>
          <ShieldCheck aria-hidden="true" />
          <span>Notre engagement</span>
          <strong>Des informations claires et des données protégées.</strong>
          <p>Nous ne revendons pas vos données personnelles.</p>
        </div>
      </section>

      <nav className={styles.summary} aria-label="Sommaire de la page">
        <a href="#editeur">Éditeur</a>
        <a href="#hebergement">Hébergement</a>
        <a href="#donnees">Données personnelles</a>
        <a href="#cookies">Cookies et mesure d’audience</a>
        <a href="#droits">Vos droits</a>
        <a href="#propriete">Propriété intellectuelle</a>
      </nav>

      <div className={styles.content}>
        <section className={styles.section} id="editeur" aria-labelledby="publisher-title">
          <SectionTitle icon={Building2} eyebrow="01 — Identification" id="publisher-title">
            Éditeur du site
          </SectionTitle>
          <div className={styles.identityGrid}>
            <article>
              <p className={styles.identityNumber}>01</p>
              <h3>La société</h3>
              <p>
                Le site est édité par <strong>Agence Séverine Masfrand — ASM</strong>,
                société par actions simplifiée au capital de 1 000 €, dont le siège
                social est situé 595 route des Aubes, 13400 Aubagne.
              </p>
              <dl>
                <LegalFact label="SIREN">829 076 611</LegalFact>
                <LegalFact label="SIRET">829 076 611 00013</LegalFact>
                <LegalFact label="RCS">Marseille 829 076 611</LegalFact>
                <LegalFact label="TVA">FR77 829076611</LegalFact>
              </dl>
            </article>
            <article>
              <p className={styles.identityNumber}>02</p>
              <h3>L’activité immobilière</h3>
              <p>
                L’agence exerce une activité de transaction sur immeubles et fonds
                de commerce sous la carte professionnelle délivrée par la CCI
                Marseille Provence.
              </p>
              <dl>
                <LegalFact label="Carte professionnelle">CPI 1310 2021 000 000 132</LegalFact>
                <LegalFact label="Autorité">CCI Marseille Provence</LegalFact>
              </dl>
            </article>
            <article>
              <p className={styles.identityNumber}>03</p>
              <h3>La publication</h3>
              <p>
                La direction de la publication est assurée par
                <strong> Séverine Masfrand</strong>, en sa qualité de Présidente de
                la société.
              </p>
              <dl>
                <LegalFact label="Contact">contact@jumellesimmo.fr</LegalFact>
              </dl>
            </article>
          </div>
          <div className={styles.contactLine}>
            <a href="mailto:contact@jumellesimmo.fr"><Mail aria-hidden="true" /> contact@jumellesimmo.fr</a>
            <Link href="/honoraires">Consulter nos honoraires</Link>
          </div>
        </section>

        <section className={styles.section} id="hebergement" aria-labelledby="hosting-title">
          <SectionTitle icon={Database} eyebrow="02 — Infrastructure" id="hosting-title">
            Hébergement du site
          </SectionTitle>
          <div className={styles.prose}>
            <p>
              Le site est hébergé par <strong>Vercel Inc.</strong>, 440 N Barranca
              Avenue #4133, Covina, CA 91723, États-Unis. Les fonctions serveur
              du site sont configurées pour être exécutées dans la région Vercel
              de Paris, France (<strong>cdg1</strong>). Les contenus statiques
              peuvent être distribués depuis le réseau mondial de diffusion de
              Vercel afin d’être servis depuis un point proche du visiteur.
            </p>
            <p>
              Le stockage applicatif, l’authentification et certains fichiers sont
              opérés au moyen de services techniques sécurisés fournis notamment
              par Supabase. La localisation de ces données dépend de la région
              configurée pour le projet Supabase.
            </p>
            <p>
              Site internet :{" "}
              <a href="https://vercel.com" rel="noreferrer" target="_blank">
                vercel.com <ExternalLink aria-hidden="true" />
              </a>
            </p>
          </div>
        </section>

        <section className={styles.section} id="donnees" aria-labelledby="privacy-title">
          <SectionTitle icon={LockKeyhole} eyebrow="03 — Vie privée" id="privacy-title">
            Protection des données personnelles
          </SectionTitle>
          <div className={styles.prose}>
            <p>
              Agence Séverine Masfrand — ASM est responsable des traitements
              réalisés à partir du site. Seules les informations utiles à votre
              demande, à votre espace ou à la sécurité du service sont collectées.
            </p>
          </div>

          <div className={styles.processingGrid}>
            <article>
              <span>Estimation immobilière</span>
              <h3>Adresse et caractéristiques du bien</h3>
              <p>Produire une estimation, l’enregistrer dans votre espace et permettre son suivi.</p>
              <small>Base : mesures précontractuelles demandées par l’utilisateur.</small>
            </article>
            <article>
              <span>Recherche accompagnée</span>
              <h3>Identité, coordonnées et critères de recherche</h3>
              <p>Étudier votre projet, proposer des biens adaptés et assurer les échanges demandés.</p>
              <small>Base : mesures précontractuelles et consentement selon les communications.</small>
            </article>
            <article>
              <span>Contact et demandes de visite</span>
              <h3>Coordonnées et contenu du message</h3>
              <p>Répondre à votre demande et organiser le suivi commercial correspondant.</p>
              <small>Base : mesures précontractuelles ou intérêt légitime à répondre.</small>
            </article>
            <article>
              <span>Compte et sécurité</span>
              <h3>Identifiants, sessions et journaux techniques</h3>
              <p>Authentifier les utilisateurs, prévenir les abus et protéger le site.</p>
              <small>Base : exécution du service et intérêt légitime de sécurité.</small>
            </article>
            <article>
              <span>Annonces immobilières</span>
              <h3>Consultations et interactions agrégées</h3>
              <p>Mesurer l’intérêt pour une annonce et améliorer sa présentation.</p>
              <small>Base : intérêt légitime, avec identifiant technique pseudonyme.</small>
            </article>
            <article>
              <span>Obligations réglementaires</span>
              <h3>Documents et éléments de preuve</h3>
              <p>Respecter les obligations légales, comptables et défendre nos droits.</p>
              <small>Base : obligation légale et intérêt légitime.</small>
            </article>
          </div>

          <div className={styles.twoColumns}>
            <article>
              <h3>Destinataires</h3>
              <p>
                Les données sont accessibles aux personnes habilitées de l’agence
                et, dans la stricte limite de leurs missions, à ses prestataires
                d’hébergement, de base de données, d’authentification, d’envoi
                d’e-mails et de données immobilières. Elles ne sont jamais vendues.
              </p>
            </article>
            <article>
              <h3>Durées de conservation</h3>
              <p>
                Les demandes de prospects sont conservées au maximum trois ans à
                compter du dernier contact actif. Les données de compte sont
                conservées pendant sa durée d’utilisation, puis archivées ou
                supprimées selon les obligations applicables. Les preuves et
                documents contractuels suivent les délais légaux ; les journaux de
                sécurité sont conservés pour une durée limitée.
              </p>
            </article>
            <article>
              <h3>Transferts hors Espace économique européen</h3>
              <p>
                Bien que les fonctions serveur soient configurées pour s’exécuter
                à Paris, certains prestataires techniques sont établis hors de
                l’Espace économique européen ou peuvent y réaliser des opérations
                accessoires. Les transferts concernés sont encadrés par les
                mécanismes reconnus par le RGPD, notamment les clauses
                contractuelles types ou une décision d’adéquation lorsqu’elle est
                applicable.
              </p>
            </article>
            <article>
              <h3>Sécurité</h3>
              <p>
                L’agence met en œuvre des mesures proportionnées : connexions
                chiffrées, accès restreints, authentification des espaces privés,
                limitation des requêtes sensibles et surveillance des usages
                anormaux. Aucun système ne pouvant être garanti sans risque, les
                mesures sont réévaluées régulièrement.
              </p>
            </article>
          </div>
        </section>

        <section className={styles.section} id="cookies" aria-labelledby="cookies-title">
          <SectionTitle icon={FileText} eyebrow="04 — Traceurs" id="cookies-title">
            Cookies et mesure d’audience
          </SectionTitle>
          <div className={styles.prose}>
            <p>
              Le site utilise des traceurs strictement nécessaires à la connexion
              aux espaces privés, à la sécurité et au maintien des choix de
              formulaire. Ils ne nécessitent pas de consentement lorsqu’ils sont
              indispensables au service demandé.
            </p>
            <p>
              La consultation des annonces peut également être comptabilisée au
              moyen d’un identifiant pseudonyme enregistré localement afin d’éviter
              les doublons et de produire des statistiques agrégées. Avec votre
              accord préalable, Google Analytics 4 mesure également les pages vues,
              les parcours et les interactions afin d’améliorer le site. Le traceur
              Google n’est chargé qu’après acceptation et votre choix est conservé
              pendant six mois. Vous pouvez le modifier à tout moment avec le lien
              « Gérer mes cookies » présent dans le pied de page. Aucun ciblage
              publicitaire n’est activé.
            </p>
          </div>
        </section>

        <section className={styles.section} id="droits" aria-labelledby="rights-title">
          <SectionTitle icon={Scale} eyebrow="05 — Vos choix" id="rights-title">
            Exercer vos droits
          </SectionTitle>
          <div className={styles.prose}>
            <p>
              Vous pouvez demander l’accès, la rectification, l’effacement ou la
              portabilité de vos données, ainsi que la limitation d’un traitement
              ou vous y opposer. Lorsqu’un traitement repose sur votre consentement,
              vous pouvez le retirer à tout moment sans remettre en cause les
              opérations déjà réalisées.
            </p>
            <p>
              Écrivez à <a href="mailto:contact@jumellesimmo.fr">contact@jumellesimmo.fr</a>
              {" "}ou à Agence Séverine Masfrand — ASM, 595 route des Aubes,
              13400 Aubagne. Pour protéger vos données, un justificatif d’identité
              pourra être demandé uniquement en cas de doute raisonnable.
            </p>
            <p>
              Si vous estimez que vos droits ne sont pas respectés, vous pouvez
              adresser une réclamation à la{" "}
              <a href="https://www.cnil.fr/fr/plaintes" rel="noreferrer" target="_blank">
                CNIL <ExternalLink aria-hidden="true" />
              </a>.
            </p>
            <p>
              Si vous communiquez votre numéro de téléphone, vous pouvez également
              vous inscrire gratuitement sur la liste d’opposition au démarchage
              téléphonique{" "}
              <a href="https://www.bloctel.gouv.fr" rel="noreferrer" target="_blank">
                Bloctel <ExternalLink aria-hidden="true" />
              </a>.
            </p>
          </div>
        </section>

        <section className={styles.section} id="propriete" aria-labelledby="property-title">
          <SectionTitle icon={FileText} eyebrow="06 — Utilisation" id="property-title">
            Propriété intellectuelle et responsabilité
          </SectionTitle>
          <div className={styles.prose}>
            <p>
              La structure du site, les textes, créations graphiques, marques,
              logos, photographies et contenus qui le composent sont protégés.
              Toute reproduction, représentation, adaptation ou extraction, même
              partielle, nécessite l’autorisation écrite préalable de leur titulaire,
              sauf exception prévue par la loi.
            </p>
            <p>
              Les informations immobilières, estimations et données de marché ont
              une vocation indicative et ne constituent ni une expertise juridique,
              ni une offre contractuelle. Malgré le soin apporté à leur mise à jour,
              l’agence ne peut garantir l’absence absolue d’erreur ou d’interruption.
              Les liens externes sont proposés à titre pratique ; leur contenu reste
              sous la responsabilité de leurs éditeurs.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function LegalFact({ children, label }: { children: React.ReactNode; label: string }) {
  return <div><dt>{label}</dt><dd>{children}</dd></div>;
}

function SectionTitle({ children, eyebrow, icon: Icon, id }: {
  children: React.ReactNode;
  eyebrow: string;
  icon: typeof Building2;
  id: string;
}) {
  return (
    <div className={styles.sectionTitle}>
      <Icon aria-hidden="true" />
      <div><p className={styles.eyebrow}>{eyebrow}</p><h2 id={id}>{children}</h2></div>
    </div>
  );
}
