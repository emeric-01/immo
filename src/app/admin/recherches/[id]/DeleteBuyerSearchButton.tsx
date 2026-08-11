"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Trash2, X } from "lucide-react";
import styles from "../../properties.module.css";

export function DeleteBuyerSearchButton({ contactName, searchId }: { contactName: string; searchId: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isDeleting) setIsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isDeleting, isOpen]);

  async function deleteSearch() {
    setIsDeleting(true);
    setError("");
    try {
      const response = await fetch(`/admin/api/recherches/${encodeURIComponent(searchId)}`, { method: "DELETE" });
      const body = await response.text();
      const result = body ? JSON.parse(body) as { error?: string } : {};
      if (!response.ok) throw new Error(result.error || "Suppression impossible.");
      router.push("/admin/recherches");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Suppression impossible.");
      setIsDeleting(false);
    }
  }

  return <>
    <button className={styles.deletePropertyButton} onClick={() => setIsOpen(true)} type="button"><Trash2 aria-hidden="true" size={17} />Supprimer la recherche</button>
    {isOpen ? <div className={styles.dialogBackdrop} onMouseDown={(event) => { if (event.currentTarget === event.target && !isDeleting) setIsOpen(false); }} role="presentation">
      <section aria-describedby="delete-search-description" aria-labelledby="delete-search-title" aria-modal="true" className={styles.confirmDialog} role="dialog">
        <button aria-label="Fermer" className={styles.dialogClose} disabled={isDeleting} onClick={() => setIsOpen(false)} type="button"><X aria-hidden="true" size={19} /></button>
        <span className={styles.dialogIcon}><Trash2 aria-hidden="true" size={22} /></span>
        <h2 id="delete-search-title">Supprimer cette recherche ?</h2>
        <p id="delete-search-description">Êtes-vous certain de vouloir supprimer définitivement la recherche de <strong>{contactName}</strong> ?</p>
        <p className={styles.deleteWarning}>Les secteurs, priorités et preuves de consentement liés seront supprimés. Le contact ou compte client sera conservé. Cette action est irréversible.</p>
        {error ? <p className={styles.dialogError} role="alert">{error}</p> : null}
        <div className={styles.dialogActions}><button disabled={isDeleting} onClick={() => setIsOpen(false)} type="button">Annuler</button><button disabled={isDeleting} onClick={deleteSearch} type="button">{isDeleting ? <LoaderCircle aria-hidden="true" className={styles.spin} size={18} /> : <Trash2 aria-hidden="true" size={18} />}Supprimer définitivement</button></div>
      </section>
    </div> : null}
  </>;
}
