import type { Metadata } from "next";
import { LockKeyhole } from "lucide-react";
import { isAdminAccessConfigured } from "@/lib/admin/auth";
import { loginAdmin } from "./actions";
import styles from "../admin.module.css";

export const metadata: Metadata = {
  title: "Admin | Les Jumelles Immo",
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const hasError = params.error === "1";
  const isConfigured = isAdminAccessConfigured();

  return (
    <main className={styles.loginPage}>
      <section className={styles.loginPanel}>
        <div className={styles.brandMark}>
          <span>les jumelles</span>
          <strong>IMMO</strong>
        </div>
        <div className={styles.loginIcon}>
          <LockKeyhole size={24} aria-hidden="true" />
        </div>
        <h1>Espace admin</h1>
        <p>Acces reserve a l&apos;equipe Les Jumelles Immo pour suivre les recherches acheteurs.</p>
        {!isConfigured ? (
          <div className={styles.noticeBox}>
            Configurez d&apos;abord <strong>SUPABASE_SERVICE_ROLE_KEY</strong> ou <strong>ADMIN_ACCESS_TOKEN</strong>.
          </div>
        ) : (
          <form action={loginAdmin} className={styles.loginForm}>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" placeholder="admin@lesjumelles.immo" required />
            <label htmlFor="password">Mot de passe</label>
            <input id="password" name="password" type="password" placeholder="Votre mot de passe" required />
            <p className={styles.helpText}>Le token bootstrap reste accepte tant qu&apos;aucun compte admin n&apos;est cree.</p>
            {hasError ? <p className={styles.errorText}>Code incorrect.</p> : null}
            <button type="submit">Entrer dans l&apos;admin</button>
          </form>
        )}
      </section>
    </main>
  );
}
