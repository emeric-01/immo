"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, LoaderCircle, Send } from "lucide-react";
import styles from "./parrainage.module.css";

type SubmitState = "idle" | "loading" | "success" | "error";

type SponsorDefaults = {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
};

export function ReferralForm({ sponsor }: { sponsor?: SponsorDefaults | null }) {
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
      const response = await fetch("/api/referrals", {
        body: JSON.stringify({
          ...payload,
          informedConsent: formData.get("informedConsent") === "accepted",
          privacyConsent: formData.get("privacyConsent") === "accepted",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error || "Votre parrainage n’a pas pu être envoyé.");
      }

      form.reset();
      setState("success");
      setMessage("Merci. Votre parrainage est bien enregistré. Notre équipe vous recontactera rapidement.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Votre parrainage n’a pas pu être envoyé.");
    }
  }

  return (
    <form className={styles.referralForm} onSubmit={handleSubmit}>
      <fieldset>
        <legend>Vos coordonnées</legend>
        <div className={styles.twoColumns}>
          <label>
            <span>Prénom *</span>
            <input autoComplete="given-name" defaultValue={sponsor?.firstName ?? ""} name="sponsorFirstName" required />
          </label>
          <label>
            <span>Nom *</span>
            <input autoComplete="family-name" defaultValue={sponsor?.lastName ?? ""} name="sponsorLastName" required />
          </label>
          <label>
            <span>Email *</span>
            <input autoComplete="email" defaultValue={sponsor?.email ?? ""} inputMode="email" name="sponsorEmail" required type="email" />
          </label>
          <label>
            <span>Téléphone *</span>
            <input autoComplete="tel" defaultValue={sponsor?.phone ?? ""} inputMode="tel" name="sponsorPhone" placeholder="06 12 34 56 78" required type="tel" />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Le projet de votre proche</legend>
        <div className={styles.twoColumns}>
          <label>
            <span>Prénom *</span>
            <input autoComplete="off" name="referredFirstName" required />
          </label>
          <label>
            <span>Nom *</span>
            <input autoComplete="off" name="referredLastName" required />
          </label>
          <label>
            <span>Téléphone *</span>
            <input autoComplete="off" inputMode="tel" name="referredPhone" placeholder="06 12 34 56 78" required type="tel" />
          </label>
          <label>
            <span>Email <small>facultatif</small></span>
            <input autoComplete="off" inputMode="email" name="referredEmail" type="email" />
          </label>
          <label>
            <span>Son projet *</span>
            <select defaultValue="" name="projectKind" required>
              <option disabled value="">Vendre ou acheter</option>
              <option value="sell">Vendre un bien</option>
              <option value="buy">Acheter un bien</option>
            </select>
          </label>
          <label>
            <span>Type de bien *</span>
            <select defaultValue="" name="propertyType" required>
              <option disabled value="">Maison, appartement…</option>
              <option value="house">Maison</option>
              <option value="apartment">Appartement</option>
              <option value="land">Terrain</option>
              <option value="other">Autre bien</option>
            </select>
          </label>
          <label className={styles.fullField}>
            <span>Ville ou secteur *</span>
            <input autoComplete="off" name="propertyCity" placeholder="Ex. Aubagne, Gémenos, La Ciotat" required />
          </label>
          <label className={styles.fullField}>
            <span>Quelques mots sur son projet <small>facultatif</small></span>
            <textarea maxLength={1000} name="message" placeholder="Délai, bien concerné, contexte…" rows={3} />
          </label>
        </div>
      </fieldset>

      <label className={styles.honeypot} aria-hidden="true">
        <span>Ne pas remplir</span>
        <input autoComplete="off" name="website" tabIndex={-1} />
      </label>

      <div className={styles.consents}>
        <label>
          <input name="informedConsent" required type="checkbox" value="accepted" />
          <span>Je confirme avoir informé mon proche et obtenu son accord pour transmettre ses coordonnées. *</span>
        </label>
        <label>
          <input name="privacyConsent" required type="checkbox" value="accepted" />
          <span>J’accepte que Les Jumelles Immo utilise ces informations pour traiter ce parrainage. *</span>
        </label>
      </div>

      <button disabled={state === "loading"} type="submit">
        {state === "loading" ? <LoaderCircle className={styles.spinner} aria-hidden="true" /> : <Send aria-hidden="true" />}
        {state === "loading" ? "Envoi en cours…" : "Envoyer mon parrainage"}
      </button>
      <p className={styles.formPrivacy}>Données confidentielles · Aucun engagement pour votre proche</p>
      {message ? (
        <p className={state === "success" ? styles.formSuccess : styles.formError} role="status">
          {state === "success" ? <CheckCircle2 aria-hidden="true" /> : null}
          {message}
        </p>
      ) : null}
    </form>
  );
}
