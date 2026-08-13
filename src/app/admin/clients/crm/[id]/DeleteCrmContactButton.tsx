"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Trash2 } from "lucide-react";
import styles from "../../../properties.module.css";

export function DeleteCrmContactButton({ contactId, contactName }: { contactId: string; contactName: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function remove() {
    if (!window.confirm(`Supprimer définitivement la fiche CRM de ${contactName} ? Les éléments liés seront conservés mais détachés de la fiche.`)) return;
    setBusy(true); setError("");
    const response = await fetch(`/admin/api/crm/contacts/${encodeURIComponent(contactId)}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) { setError(result.error || "Suppression impossible."); setBusy(false); return; }
    router.push("/admin/clients"); router.refresh();
  }
  return <div><button className={styles.deletePropertyButton} disabled={busy} onClick={remove} type="button">{busy ? <LoaderCircle className={styles.spin} size={17}/> : <Trash2 size={17}/>}Supprimer la fiche</button>{error ? <p role="alert">{error}</p> : null}</div>;
}
