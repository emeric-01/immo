"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, LoaderCircle } from "lucide-react";
import styles from "../../admin.module.css";

export function GenerateEstimationPdfButton({ estimationId }: { estimationId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function generate() {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/admin/api/estimations/${estimationId}/pdf`, { method: "POST" });
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || "Le PDF n’a pas pu être généré.");
      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const filename = disposition.match(/filename="([^"]+)"/)?.[1] ?? `estimation-${estimationId}.pdf`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a"); link.href = url; link.download = filename; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Erreur inattendue."); }
    finally { setLoading(false); }
  }
  return <div><button className={styles.primaryButton} disabled={loading} onClick={generate} type="button">{loading ? <LoaderCircle className={styles.spin} size={18} /> : <Download size={18} />}{loading ? "Création et archivage…" : "Générer le PDF"}</button>{error ? <small className={styles.formError}>{error}</small> : null}</div>;
}
