"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./account.module.css";

type State = { message: string; status: "error" | "idle" | "saving" | "success" };

export function ProfileForm({ email, fullName, disabled = false }: { email: string; fullName: string; disabled?: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ message: "", status: "idle" });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setState({ message: "", status: "saving" });
    const data = new FormData(form);
    const response = await fetch("/api/admin/account/profile", {
      body: JSON.stringify({
        currentPassword: String(data.get("currentPassword") ?? ""),
        email: String(data.get("email") ?? ""),
        fullName: String(data.get("fullName") ?? ""),
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    if (!response.ok) {
      setState({ message: payload?.error || "La modification a échoué.", status: "error" });
      return;
    }
    form.reset();
    setState({ message: "Vos informations ont été modifiées.", status: "success" });
    router.refresh();
  }

  if (disabled) return null;
  return (
    <form className={styles.passwordForm} onSubmit={submit}>
      <label>Nom et prénom<input defaultValue={fullName} name="fullName" required /></label>
      <label>Adresse e-mail<input autoComplete="email" defaultValue={email} name="email" required type="email" /></label>
      <label>Mot de passe actuel<input autoComplete="current-password" name="currentPassword" required type="password" /></label>
      <small>Votre mot de passe confirme la modification de vos informations personnelles.</small>
      {state.status === "error" ? <p data-error role="alert">{state.message}</p> : null}
      {state.status === "success" ? <p data-success role="status">{state.message}</p> : null}
      <button disabled={state.status === "saving"} type="submit"><Save size={18}/>{state.status === "saving" ? "Enregistrement…" : "Enregistrer mes informations"}</button>
    </form>
  );
}
