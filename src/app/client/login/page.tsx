import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, Mail, ShieldCheck } from "lucide-react";
import { requestLoginCode, verifyLoginCode } from "./actions";
import styles from "../client.module.css";

export const metadata: Metadata = {
  title: "Acces client | Les Jumelles Immo",
};

export default async function ClientLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string; sent?: string }>;
}) {
  const params = await searchParams;
  const email = params.email ?? "";
  const codeSent = params.sent === "1";

  return (
    <main className={styles.loginPage}>
      <section className={styles.loginPanel}>
        <Link className={styles.brandMark} href="/">
          <span>les jumelles</span>
          <strong>IMMO</strong>
        </Link>
        <span className={styles.loginIcon}>
          {codeSent ? <KeyRound size={24} aria-hidden="true" /> : <Mail size={24} aria-hidden="true" />}
        </span>
        <div>
          <p className={styles.eyebrow}>Espace client</p>
          <h1>{codeSent ? "Saisissez votre code" : "Acceder a mon espace"}</h1>
          <p>
            {codeSent
              ? "Un code temporaire vient d'etre envoye. Il reste valable pendant 10 minutes."
              : "Recevez un code par email pour retrouver toutes vos recherches et estimations."}
          </p>
        </div>
        {params.error ? <p className={styles.errorText}>{formatLoginError(params.error)}</p> : null}
        {codeSent ? (
          <form className={styles.loginForm} action={verifyLoginCode}>
            <input name="email" type="hidden" value={email} />
            <label>
              Code recu par email
              <input
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                placeholder="000000"
                required
              />
            </label>
            <button type="submit">
              <ShieldCheck size={18} aria-hidden="true" />
              Ouvrir mon espace
            </button>
          </form>
        ) : (
          <form className={styles.loginForm} action={requestLoginCode}>
            <label>
              Email du compte client
              <input name="email" type="email" autoComplete="email" defaultValue={email} required />
            </label>
            <button type="submit">
              <Mail size={18} aria-hidden="true" />
              Recevoir mon code
            </button>
          </form>
        )}
        {codeSent ? (
          <form action={requestLoginCode}>
            <input name="email" type="hidden" value={email} />
            <button className={styles.textButton} type="submit">Renvoyer un code</button>
          </form>
        ) : null}
      </section>
    </main>
  );
}

function formatLoginError(error: string) {
  if (error === "invalid_email") {
    return "Renseignez une adresse email valide.";
  }

  if (error === "delivery") {
    return "Le code n'a pas pu etre envoye. Reessayez dans quelques instants.";
  }

  return "Ce code est incorrect ou a expire.";
}
