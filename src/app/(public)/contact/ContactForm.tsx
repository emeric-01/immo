"use client";

import { FormEvent, useRef, useState } from "react";
import { CheckCircle2, LoaderCircle, Send } from "lucide-react";
import styles from "./contact.module.css";

type SubmitState = "idle" | "loading" | "success" | "error";

export function ContactForm() {
  const [state, setState] = useState<SubmitState>("idle");
  const [feedback, setFeedback] = useState("");
  const startedAt = useRef(Date.now());

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setFeedback("");
    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/contact", {
        body: JSON.stringify({
          ...Object.fromEntries(formData.entries()),
          consent: formData.get("consent") === "accepted",
          formStartedAt: startedAt.current,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Votre message n’a pas pu être envoyé.");

      form.reset();
      startedAt.current = Date.now();
      setState("success");
      setFeedback("Merci, votre message a bien été envoyé. Nous revenons vers vous rapidement.");
    } catch (error) {
      setState("error");
      setFeedback(error instanceof Error ? error.message : "Votre message n’a pas pu être envoyé.");
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formHeading}>
        <p>Votre demande</p>
        <h2>Parlez-nous de votre projet.</h2>
        <span>Quelques lignes suffisent. Nous vous recontactons rapidement.</span>
      </div>
      <div className={styles.formGrid}>
        <label className={styles.fullField}><span>Nom et prénom *</span><input autoComplete="name" name="name" required /></label>
        <label><span>Email</span><input autoComplete="email" inputMode="email" name="email" placeholder="vous@exemple.fr" type="email" /></label>
        <label><span>Téléphone</span><input autoComplete="tel" inputMode="tel" name="phone" placeholder="06 12 34 56 78" type="tel" /></label>
        <label className={styles.fullField}>
          <span>Votre projet *</span>
          <select defaultValue="" name="subject" required>
            <option disabled value="">Choisir l’objet de votre demande</option>
            <option>Acheter un bien</option><option>Vendre un bien</option><option>Faire estimer un bien</option>
            <option>Suivre une demande</option><option>Rejoindre l’agence</option><option>Autre demande</option>
          </select>
        </label>
        <label className={styles.fullField}><span>Votre message *</span><textarea maxLength={2500} minLength={10} name="message" placeholder="Parlez-nous de votre projet, du bien ou de votre question…" required rows={6} /></label>
      </div>
      <label className={styles.honeypot} aria-hidden="true"><span>Ne pas remplir</span><input autoComplete="off" name="website" tabIndex={-1} /></label>
      <label className={styles.consent}><input name="consent" required type="checkbox" value="accepted" /><span>J’accepte que mes informations soient utilisées pour répondre à ma demande. *</span></label>
      <button disabled={state === "loading"} type="submit">
        {state === "loading" ? <LoaderCircle className={styles.spinner} aria-hidden="true" /> : <Send aria-hidden="true" />}
        {state === "loading" ? "Envoi en cours…" : "Envoyer mon message"}
      </button>
      <p className={styles.privacy}>Vos données restent confidentielles et ne sont jamais revendues.</p>
      {feedback ? <p className={state === "success" ? styles.success : styles.error} role="status">{state === "success" ? <CheckCircle2 aria-hidden="true" /> : null}{feedback}</p> : null}
    </form>
  );
}
