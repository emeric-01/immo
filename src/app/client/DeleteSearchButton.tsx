"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Trash2, X } from "lucide-react";
import styles from "./client.module.css";

export function DeleteSearchButton({ searchId }: { searchId: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isDeleting) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDeleting, isOpen]);

  async function deleteSearch() {
    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/client/searches/${encodeURIComponent(searchId)}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error || "Suppression impossible.");
      }

      setIsOpen(false);
      router.push("/client");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Suppression impossible.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <button
        aria-label="Supprimer la recherche"
        className={styles.deleteIconButton}
        onClick={() => setIsOpen(true)}
        title="Supprimer la recherche"
        type="button"
      >
        <Trash2 size={18} aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className={styles.dialogBackdrop} role="presentation">
          <section
            aria-describedby="delete-search-description"
            aria-labelledby="delete-search-title"
            aria-modal="true"
            className={styles.confirmDialog}
            role="dialog"
          >
            <button
              aria-label="Fermer"
              className={styles.dialogClose}
              disabled={isDeleting}
              onClick={() => setIsOpen(false)}
              type="button"
            >
              <X size={19} aria-hidden="true" />
            </button>
            <span className={styles.dialogIcon}><Trash2 size={22} aria-hidden="true" /></span>
            <h2 id="delete-search-title">Supprimer cette recherche ?</h2>
            <p id="delete-search-description">
              Elle disparaitra de votre espace client. L&apos;agence la conservera dans son historique
              avec la mention « Supprimee par l&apos;utilisateur ».
            </p>
            {error ? <p className={styles.dialogError} role="alert">{error}</p> : null}
            <div className={styles.dialogActions}>
              <button disabled={isDeleting} onClick={() => setIsOpen(false)} type="button">
                Annuler
              </button>
              <button disabled={isDeleting} onClick={deleteSearch} type="button">
                {isDeleting ? <LoaderCircle className={styles.spin} size={18} aria-hidden="true" /> : <Trash2 size={18} aria-hidden="true" />}
                Supprimer
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
