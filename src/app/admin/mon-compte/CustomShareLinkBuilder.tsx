"use client";

import { ExternalLink, Link2, Sparkles } from "lucide-react";
import { type FormEvent, useState } from "react";
import { buildAgentShareLink, type AgentShareLinkAttribution } from "@/lib/admin/agent-share-link";
import { CopyLinkButton } from "../mes-liens/CopyLinkButton";
import styles from "./account.module.css";

type Props = {
  attribution: AgentShareLinkAttribution;
  siteUrl: string;
};

export function CustomShareLinkBuilder({ attribution, siteUrl }: Props) {
  const [input, setInput] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputId = `custom-share-url-${attribution.code}`;
  const helpId = `custom-share-help-${attribution.code}`;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = buildAgentShareLink(input, siteUrl, attribution);

    if (!result.success) {
      setGeneratedUrl(null);
      setError(result.error);
      return;
    }

    setError(null);
    setGeneratedUrl(result.url);
  }

  function handleInput(value: string) {
    setInput(value);
    setError(null);
    setGeneratedUrl(null);
  }

  return (
    <section className={styles.customLinkBuilder}>
      <div className={styles.customLinkHeading}>
        <span><Sparkles aria-hidden="true" size={19}/></span>
        <div>
          <h3>Créer un lien depuis une page du site</h3>
          <p>Collez l’URL de la page que vous souhaitez partager.</p>
        </div>
      </div>
      <form className={styles.customLinkForm} onSubmit={handleSubmit}>
        <label htmlFor={inputId}>URL d’une page Les Jumelles Immo</label>
        <div>
          <input
            aria-describedby={helpId}
            aria-invalid={Boolean(error)}
            autoComplete="url"
            id={inputId}
            inputMode="url"
            onChange={(event) => handleInput(event.target.value)}
            placeholder={`${siteUrl}/prix-immobilier/...`}
            spellCheck="false"
            type="text"
            value={input}
          />
          <button type="submit"><Link2 aria-hidden="true" size={18}/>Générer le lien</button>
        </div>
        <small id={helpId}>L’origine et votre référence agent seront ajoutées automatiquement.</small>
      </form>
      {error ? <p className={styles.customLinkError} role="alert">{error}</p> : null}
      {generatedUrl ? (
        <div className={styles.generatedLink} aria-live="polite">
          <div className={styles.generatedLinkMeta}>
            <span>Origine <strong>{attribution.source} / {attribution.medium}</strong></span>
            <span>Référence agent <strong>{attribution.code}</strong></span>
          </div>
          <div className={styles.urlLine}>
            <code>{generatedUrl}</code>
            <div className={styles.generatedLinkActions}>
              <CopyLinkButton value={generatedUrl}/>
              <a aria-label="Ouvrir le lien généré" href={generatedUrl} rel="noreferrer" target="_blank"><ExternalLink aria-hidden="true" size={17}/></a>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
