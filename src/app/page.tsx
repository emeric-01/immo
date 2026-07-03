import { EstimationForm } from "./estimation-form";

export default function Home() {
  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">ImmoSafe MVP</p>
          <h1>Adresse, caracteristiques, fourchette.</h1>
          <p className="intro">
            Premier module d&apos;estimation seller-first : geocodage Immo Data,
            valorisation et resultat lisible sur mobile.
          </p>
        </div>
        <div className="status-card" aria-label="Statut du projet">
          <span className="status-dot" />
          API serveur
        </div>
      </section>

      <EstimationForm />
    </main>
  );
}
