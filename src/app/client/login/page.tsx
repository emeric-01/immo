import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, LockKeyhole } from "lucide-react";
import { loginClient } from "./actions";
import styles from "../client.module.css";

export const metadata: Metadata = {
  title: "Acces client | Les Jumelles Immo",
};

export default async function ClientLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; email?: string; error?: string; reference?: string }>;
}) {
  const params = await searchParams;
  const defaults = {
    code: params.code ?? "",
    email: params.email ?? "",
    reference: params.reference ?? "",
  };

  return (
    <main className={styles.loginPage}>
      <section className={styles.loginPanel}>
        <Link className={styles.brandMark} href="/">
          <span>les jumelles</span>
          <strong>IMMO</strong>
        </Link>
        <span className={styles.loginIcon}>
          <KeyRound size={24} aria-hidden="true" />
        </span>
        <div>
          <p className={styles.eyebrow}>Espace client</p>
          <h1>Retrouver mon projet</h1>
          <p>Connectez-vous avec l&apos;email, la reference et le code recus apres l&apos;enregistrement.</p>
        </div>
        {params.error ? <p className={styles.errorText}>{formatLoginError(params.error)}</p> : null}
        <form className={styles.loginForm} action={loginClient}>
          <label>
            Email
            <input name="email" type="email" autoComplete="email" defaultValue={defaults.email} required />
          </label>
          <label>
            Reference
            <input name="reference" placeholder="LJI-ABC123" defaultValue={defaults.reference} required />
          </label>
          <label>
            Code d&apos;acces
            <input name="code" autoComplete="one-time-code" defaultValue={defaults.code} required />
          </label>
          <button type="submit">
            <LockKeyhole size={18} aria-hidden="true" />
            Acceder a mon projet
          </button>
        </form>
      </section>
    </main>
  );
}

function formatLoginError(error: string) {
  if (error === "missing_config") {
    return "L'espace client n'est pas encore configure cote serveur.";
  }

  return "Ces informations ne correspondent a aucun projet.";
}
