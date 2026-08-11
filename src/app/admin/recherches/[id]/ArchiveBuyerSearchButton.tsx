"use client";

import { Archive, ArchiveRestore, LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { updateBuyerSearchArchiveAction } from "../actions";
import styles from "../../admin.module.css";

export function ArchiveBuyerSearchButton({ hasClient, isArchived, searchId }: { hasClient: boolean; isArchived: boolean; searchId: string }) {
  return <form action={updateBuyerSearchArchiveAction} onSubmit={(event) => {
    if (isArchived) return;
    const clientWarning = hasClient ? " Elle ne sera plus visible dans l’espace client." : "";
    if (!window.confirm(`Archiver cette recherche ?${clientWarning} Vous pourrez la restaurer depuis le filtre « Archivées » dans l’admin.`)) event.preventDefault();
  }}>
    <input name="id" type="hidden" value={searchId} />
    <input name="operation" type="hidden" value={isArchived ? "restore" : "archive"} />
    <SubmitButton isArchived={isArchived} />
  </form>;
}

function SubmitButton({ isArchived }: { isArchived: boolean }) {
  const { pending } = useFormStatus();
  const Icon = isArchived ? ArchiveRestore : Archive;
  return <button className={styles.secondaryButton} disabled={pending} type="submit">{pending ? <LoaderCircle aria-hidden="true" size={17} /> : <Icon aria-hidden="true" size={17} />}{pending ? "Enregistrement…" : isArchived ? "Restaurer" : "Archiver"}</button>;
}
