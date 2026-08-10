"use client";

import { Archive, ArchiveRestore, LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { updateEstimationStatusAction } from "../actions";
import styles from "../../admin.module.css";

export function ArchiveEstimationButton({ estimationId, hasClient, isArchived }: { estimationId: string; hasClient: boolean; isArchived: boolean }) {
  return <form action={updateEstimationStatusAction} onSubmit={(event) => {
    if (isArchived) return;
    const clientWarning = hasClient ? " Elle ne sera plus visible dans l’espace client." : "";
    if (!window.confirm(`Archiver cette estimation ?${clientWarning} Vous pourrez la restaurer depuis le filtre « Archivées » dans l’admin.`)) event.preventDefault();
  }}>
    <input name="id" type="hidden" value={estimationId} />
    <input name="status" type="hidden" value={isArchived ? "active" : "archived"} />
    <SubmitButton isArchived={isArchived} />
  </form>;
}

function SubmitButton({ isArchived }: { isArchived: boolean }) {
  const { pending } = useFormStatus();
  const Icon = isArchived ? ArchiveRestore : Archive;
  return <button className={styles.secondaryButton} disabled={pending} type="submit">{pending ? <LoaderCircle aria-hidden="true" size={17} /> : <Icon aria-hidden="true" size={17} />}{pending ? "Enregistrement…" : isArchived ? "Restaurer" : "Archiver"}</button>;
}
