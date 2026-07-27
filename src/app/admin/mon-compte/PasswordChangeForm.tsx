"use client";

import { useRef, useState } from "react";
import { KeyRound } from "lucide-react";
import styles from "./account.module.css";

type State = { message: string; status: "error" | "idle" | "saving" | "success" };

export function PasswordChangeForm({ disabled = false }: { disabled?: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<State>({ message: "", status: "idle" });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ message: "", status: "saving" });
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/account/password", {
      body: JSON.stringify({
        confirmPassword: String(data.get("confirmPassword") ?? ""),
        currentPassword: String(data.get("currentPassword") ?? ""),
        newPassword: String(data.get("newPassword") ?? ""),
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    if (!response.ok) {
      setState({ message: payload?.error || "La modification a échoué.", status: "error" });
      return;
    }
    formRef.current?.reset();
    setState({ message: "Votre mot de passe a été modifié.", status: "success" });
  }

  if (disabled) return <p className={styles.accountNotice}>Le compte bootstrap utilise le mot de passe sécurisé dans Vercel. Créez un compte administrateur nominatif pour pouvoir le modifier ici.</p>;

  return (
    <form className={styles.passwordForm} onSubmit={submit} ref={formRef}>
      <label>Mot de passe actuel<input autoComplete="current-password" name="currentPassword" required type="password" /></label>
      <label>Nouveau mot de passe<input autoComplete="new-password" minLength={12} name="newPassword" required type="password" /></label>
      <label>Confirmer le nouveau mot de passe<input autoComplete="new-password" minLength={12} name="confirmPassword" required type="password" /></label>
      <small>Utilisez au minimum 12 caractères et un mot de passe différent de vos autres comptes.</small>
      {state.status === "error" ? <p data-error role="alert">{state.message}</p> : null}
      {state.status === "success" ? <p data-success role="status">{state.message}</p> : null}
      <button disabled={state.status === "saving"} type="submit"><KeyRound size={18}/>{state.status === "saving" ? "Modification…" : "Modifier mon mot de passe"}</button>
    </form>
  );
}
