"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import styles from "./local-agency.module.css";

type SubmitState = "idle" | "loading" | "success" | "error";

export function LocalAgencyLeadForm({ cityName }: { cityName: string }) {
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/seller-leads", {
        body: JSON.stringify({ ...payload, city: cityName }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error || "Votre demande n’a pas pu être envoyée.");
      }

      form.reset();
      setState("success");
      setMessage("Merci. Nous vous rappelons rapidement pour échanger sur votre bien.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Votre demande n’a pas pu être envoyée.");
    }
  }

  return (
    <form className={styles.leadForm} onSubmit={handleSubmit}>
      <label>
        <span>Type de bien</span>
        <select defaultValue="" name="propertyType" required>
          <option disabled value="">Maison ou appartement</option>
          <option value="house">Maison</option>
          <option value="apartment">Appartement</option>
          <option value="land">Terrain</option>
          <option value="other">Autre bien</option>
        </select>
      </label>
      <label>
        <span>Adresse du bien</span>
        <input autoComplete="street-address" minLength={5} name="address" placeholder={`Adresse du bien à ${cityName}`} required />
      </label>
      <label>
        <span>Votre téléphone</span>
        <input autoComplete="tel" inputMode="tel" name="phone" placeholder="06 12 34 56 78" required type="tel" />
      </label>
      <label className={styles.honeypot} aria-hidden="true">
        <span>Ne pas remplir</span>
        <input autoComplete="off" name="website" tabIndex={-1} />
      </label>
      <label className={styles.consent}>
        <input name="consent" required type="checkbox" value="accepted" />
        <span>J’accepte d’être recontacté au sujet de mon projet immobilier.</span>
      </label>
      <button disabled={state === "loading"} type="submit">
        {state === "loading" ? <LoaderCircle className={styles.spinner} size={17} /> : null}
        Être rappelé
      </button>
      <p className={styles.formPrivacy}>Vos informations restent confidentielles et ne sont jamais revendues.</p>
      {message ? (
        <p className={state === "success" ? styles.formSuccess : styles.formError} role="status">
          {state === "success" ? <CheckCircle2 size={17} /> : null}{message}
        </p>
      ) : null}
    </form>
  );
}
