const setupItems = [
  {
    label: "Projet local",
    value: "Pret",
  },
  {
    label: "Port",
    value: "3001",
  },
  {
    label: "API immo",
    value: "A brancher",
  },
  {
    label: "Base de donnees",
    value: "A brancher",
  },
];

const nextSteps = [
  "Brancher les variables API dans .env.local",
  "Creer le client API dans src/lib",
  "Ajouter les premiers modules metier",
  "Creer le repo GitHub et le projet Vercel separes",
];

export default function Home() {
  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Backoffice immo</p>
          <h1>Environnement local pret.</h1>
          <p className="intro">
            Socle isole pour construire l&apos;outil immo sans aucun impact sur la
            laverie.
          </p>
        </div>
        <div className="status-card" aria-label="Statut du projet">
          <span className="status-dot" />
          Projet separe
        </div>
      </section>

      <section className="status-grid" aria-label="Etat de configuration">
        {setupItems.map((item) => (
          <article className="status-panel" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <section className="workspace">
        <div>
          <h2>Prochaines etapes</h2>
          <ul>
            {nextSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>
        <aside>
          <h2>Isolation</h2>
          <p>
            Ce projet a son propre dossier, ses propres dependances et ses
            propres variables locales. Les secrets de la laverie restent hors du
            perimetre.
          </p>
        </aside>
      </section>
    </main>
  );
}
