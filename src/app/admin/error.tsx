"use client";

import Link from "next/link";
import { useEffect } from "react";
import styles from "./admin.module.css";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Admin interface error", error);
  }, [error]);

  return (
    <main className={styles.detailPage}>
      <div className={styles.detailShell}>
        <section className={styles.infoPanel}>
          <p className={styles.eyebrow}>Un problème est survenu</p>
          <h1>La page n’a pas pu terminer l’action.</h1>
          <p className={styles.mutedText}>Aucune nouvelle action ne sera envoyée avant votre confirmation.</p>
          <div className={styles.errorActions}>
            <button type="button" onClick={reset}>Réessayer</button>
            <Link href="/admin/recherches">Retour au tableau de bord</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
