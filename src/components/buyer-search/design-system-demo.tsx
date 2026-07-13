import Link from "next/link";
import styles from "./design-system-demo.module.css";

type ProgressStep = {
  label: string;
  status: "done" | "active" | "todo";
};

const progressSteps: ProgressStep[] = [
  { label: "Localisation", status: "done" },
  { label: "Bien", status: "done" },
  { label: "Caracteristiques", status: "active" },
  { label: "Preferences", status: "todo" },
  { label: "Projet", status: "todo" },
  { label: "Recapitulatif", status: "todo" },
  { label: "Priorites", status: "todo" },
  { label: "Coordonnees", status: "todo" },
];

const choiceCards = [
  {
    title: "Maison",
    text: "Jardin, stationnement, dependances et calme exterieur.",
    icon: "house",
    selected: true,
  },
  {
    title: "Appartement",
    text: "Etage, ascenseur, balcon, cave et copropriete.",
    icon: "building",
    selected: false,
  },
  {
    title: "Indifferent",
    text: "L'acheteur reste ouvert si le secteur et le budget collent.",
    icon: "key",
    selected: false,
  },
];

export function BuyerSearchDesignSystemDemo() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="Retour a l'accueil">
          <span className={styles.brandMark} aria-hidden="true">
            LJ
          </span>
          <span>
            <strong>Les Jumelles Immo</strong>
            <small>Recherche acheteurs</small>
          </span>
        </Link>
        <nav className={styles.headerActions} aria-label="Navigation de demo">
          <Link href="/">Estimation</Link>
          <Link aria-current="page" href="/recherche-acheteurs">
            Design system
          </Link>
        </nav>
      </header>

      <section className={styles.hero} aria-labelledby="buyer-search-title">
        <p className={styles.eyebrow}>Phase 1 · socle interface</p>
        <h1 id="buyer-search-title">
          Module de recherche acheteurs
        </h1>
        <p>
          Premiere base visuelle pour le parcours public, l&apos;espace client et le
          futur back-office : blanc, noir, beige discret et composants
          accessibles.
        </p>
      </section>

      <section className={styles.demoGrid} aria-label="Composants de reference">
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.iconPill} data-icon="route" aria-hidden="true" />
            <div>
              <h2>Progression 8 etapes</h2>
              <p>Etapes passees cochees, etape active noire.</p>
            </div>
          </div>
          <ProgressBar steps={progressSteps} />
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.iconPill} data-icon="cursor" aria-hidden="true" />
            <div>
              <h2>Actions principales</h2>
              <p>Bouton primaire noir, retour secondaire en contour.</p>
            </div>
          </div>
          <div className={styles.buttonRow}>
            <button className={styles.secondaryButton} type="button">
              Retour
            </button>
            <button className={styles.primaryButton} type="button">
              Continuer
            </button>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.iconPill} data-icon="pin" aria-hidden="true" />
            <div>
              <h2>Champ de formulaire</h2>
            <p>Labels visibles, aide et message d&apos;erreur lies au champ.</p>
            </div>
          </div>
          <label className={styles.field} htmlFor="buyer-location">
            Ville ou secteur recherche
            <input
              id="buyer-location"
              aria-describedby="buyer-location-hint buyer-location-error"
              defaultValue="Gemenos"
            />
          </label>
          <p className={styles.fieldHint} id="buyer-location-hint">
            Selection possible de plusieurs communes ou secteurs.
          </p>
          <p className={styles.fieldError} id="buyer-location-error">
            Choisissez au moins une zone valide avant de continuer.
          </p>
        </article>

        <article className={`${styles.panel} ${styles.widePanel}`}>
          <div className={styles.panelHeader}>
            <span className={styles.iconPill} data-icon="home" aria-hidden="true" />
            <div>
              <h2>Cartes de choix</h2>
              <p>Etat selectionne beige doux avec coche noire.</p>
            </div>
          </div>
          <div className={styles.choiceGrid}>
            {choiceCards.map((choice) => (
              <button
                className={styles.choiceCard}
                data-selected={choice.selected || undefined}
                type="button"
                key={choice.title}
                aria-pressed={choice.selected}
              >
                <span className={styles.iconPill} data-icon={choice.icon} aria-hidden="true" />
                <span>
                  <strong>{choice.title}</strong>
                  <small>{choice.text}</small>
                </span>
              </button>
            ))}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.iconPill} data-icon="info" aria-hidden="true" />
            <div>
              <h2>Message d&apos;information</h2>
              <p>Ton discret, lisible et sans bloquer le parcours.</p>
            </div>
          </div>
          <div className={styles.infoMessage} role="status">
            Votre brouillon est sauvegarde localement a chaque modification.
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.iconPill} data-icon="accordion" aria-hidden="true" />
            <div>
              <h2>Accordeon mobile</h2>
              <p>Cellules lisibles pour les listes longues sur petit ecran.</p>
            </div>
          </div>
          <details className={styles.accordion} open>
            <summary>Preferences maison</summary>
            <div className={styles.accordionContent}>
              <button type="button">Jardin</button>
              <button type="button">Piscine</button>
              <button type="button">Garage</button>
            </div>
          </details>
        </article>
      </section>
    </main>
  );
}

function ProgressBar({ steps }: { steps: ProgressStep[] }) {
  return (
    <ol className={styles.progress} aria-label="Progression du formulaire">
      {steps.map((step, index) => (
        <li className={styles.progressItem} data-status={step.status} key={step.label}>
          <span className={styles.progressDot} aria-hidden="true">
            {step.status === "done" ? "✓" : index + 1}
          </span>
          <span>{step.label}</span>
        </li>
      ))}
    </ol>
  );
}
