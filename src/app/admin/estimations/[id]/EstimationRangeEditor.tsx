"use client";

import { CheckCircle2, LoaderCircle, PencilLine } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../../admin.module.css";

type Props = {
  estimationId: string;
  generatedHighPrice: number;
  generatedLowPrice: number;
  generatedMedianPrice: number;
  highPrice: number;
  lowPrice: number;
  medianPrice: number;
  wasAdjusted: boolean;
};

export function EstimationRangeEditor(props: Props) {
  const router = useRouter();
  const [lowPrice, setLowPrice] = useState(String(props.lowPrice));
  const [medianPrice, setMedianPrice] = useState(String(props.medianPrice));
  const [highPrice, setHighPrice] = useState(String(props.highPrice));
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/estimations/${props.estimationId}`, {
        body: JSON.stringify({
          highPrice: Number(highPrice),
          lowPrice: Number(lowPrice),
          medianPrice: Number(medianPrice),
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const data = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(data?.error ?? "Modification impossible.");

      setState("success");
      setMessage("Fourchette enregistrée. Le rapport utilise maintenant ces valeurs.");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Modification impossible.");
    }
  }

  function restoreGeneratedRange() {
    setLowPrice(String(props.generatedLowPrice));
    setMedianPrice(String(props.generatedMedianPrice));
    setHighPrice(String(props.generatedHighPrice));
    setState("idle");
    setMessage("Valeurs calculées restaurées dans le formulaire. Enregistrez pour les appliquer.");
  }

  return (
    <section className={styles.rangeEditor} aria-labelledby="range-editor-title">
      <div className={styles.rangeEditorHeading}>
        <span><PencilLine size={20} /></span>
        <div>
          <p className={styles.eyebrow}>Validation de l’agent</p>
          <h2 id="range-editor-title">Ajuster la fourchette du rapport</h2>
          <p>Les valeurs automatiques restent conservées pour assurer la traçabilité.</p>
        </div>
        {props.wasAdjusted ? <em><CheckCircle2 size={16} />Ajustée manuellement</em> : <em>Valeurs automatiques</em>}
      </div>

      <form onSubmit={submit}>
        <label>Fourchette basse<input inputMode="numeric" min="0" required step="100" type="number" value={lowPrice} onChange={(event) => setLowPrice(event.target.value)} /></label>
        <label>Valeur centrale<input inputMode="numeric" min="0" required step="100" type="number" value={medianPrice} onChange={(event) => setMedianPrice(event.target.value)} /></label>
        <label>Fourchette haute<input inputMode="numeric" min="0" required step="100" type="number" value={highPrice} onChange={(event) => setHighPrice(event.target.value)} /></label>
        <button disabled={state === "loading"} type="submit">{state === "loading" ? <LoaderCircle className={styles.spin} size={18} /> : null}Enregistrer la fourchette</button>
      </form>

      <div className={styles.generatedRange}>
        <span>Calcul Immo Data initial : {formatCurrency(props.generatedLowPrice)} — {formatCurrency(props.generatedMedianPrice)} — {formatCurrency(props.generatedHighPrice)}</span>
        <button onClick={restoreGeneratedRange} type="button">Reprendre les valeurs automatiques</button>
      </div>
      {message ? <p className={state === "error" ? styles.errorText : styles.successText}>{message}</p> : null}
    </section>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}
