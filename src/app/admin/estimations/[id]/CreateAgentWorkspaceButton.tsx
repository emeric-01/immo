"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, LoaderCircle } from "lucide-react";
import styles from "../../admin.module.css";

export function CreateAgentWorkspaceButton({ estimationId }: { estimationId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function create() {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/admin/estimations/${estimationId}/workspace`, { method: "POST" });
      const data = await response.json() as { error?: string; id?: string };
      if (!response.ok || !data.id) throw new Error(data.error || "Création impossible.");
      router.push(`/admin/estimations/${estimationId}/dossier`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Création impossible."); setLoading(false); }
  }
  return <div><button className={styles.primaryButton} disabled={loading} onClick={create} type="button">{loading ? <LoaderCircle className={styles.spin} size={18} /> : <BriefcaseBusiness size={18} />}{loading ? "Création…" : "Créer le dossier professionnel"}</button>{error ? <small className={styles.formError}>{error}</small> : null}</div>;
}
