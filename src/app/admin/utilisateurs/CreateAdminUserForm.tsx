"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { defaultPermissionsByRole, type AdminPermission } from "@/lib/admin/permission-definitions";
import styles from "../admin.module.css";
import { PermissionChecklist } from "./PermissionChecklist";

type SubmissionState =
  | { message: string; status: "error" | "success" }
  | { message: ""; status: "idle" | "submitting" };

export function CreateAdminUserForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [submission, setSubmission] = useState<SubmissionState>({ message: "", status: "idle" });
  const [role, setRole] = useState<"admin" | "agent" | "editor" | "manager">("agent");
  const [permissions, setPermissions] = useState<AdminPermission[]>(defaultPermissionsByRole.agent);

  function selectRole(nextRole: "admin" | "agent" | "editor" | "manager") {
    setRole(nextRole);
    setPermissions(defaultPermissionsByRole[nextRole]);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmission({ message: "", status: "submitting" });

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/admin/users", {
        body: JSON.stringify({
          email: String(formData.get("email") ?? ""),
          fullName: String(formData.get("fullName") ?? ""),
          password: String(formData.get("password") ?? ""),
          permissions,
          role,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = await response.json().catch(() => null) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error || "La création du compte a échoué. Réessayez dans quelques instants.");
      }

      formRef.current?.reset();
      setSubmission({ message: "Le compte a bien été créé.", status: "success" });
      router.refresh();
    } catch (error) {
      setSubmission({
        message: error instanceof Error ? error.message : "La création du compte a échoué.",
        status: "error",
      });
    }
  }

  return (
    <>
      {submission.status === "success" ? (
        <p className={styles.successText} role="status">{submission.message}</p>
      ) : null}
      {submission.status === "error" ? (
        <p className={styles.errorText} role="alert">{submission.message}</p>
      ) : null}
      <form ref={formRef} onSubmit={handleSubmit} className={styles.userForm}>
        <label htmlFor="fullName">Nom</label>
        <input id="fullName" name="fullName" placeholder="Claire Dupont" />
        <label htmlFor="email">Email</label>
        <input id="email" name="email" placeholder="claire@lesjumelles.immo" required type="email" />
        <label htmlFor="password">Mot de passe provisoire</label>
        <input id="password" minLength={10} name="password" required type="password" />
        <label htmlFor="role">Rôle</label>
        <select id="role" name="role" onChange={(event) => selectRole(event.target.value as typeof role)} value={role}>
          <option value="manager">Manager</option>
          <option value="editor">Éditeur contenus</option>
          <option value="agent">Agent commercial</option>
          <option value="admin">Admin</option>
        </select>
        <fieldset className={styles.permissionFieldset}>
          <legend>Menus et actions autorisés</legend>
          <p>Vous pourrez modifier ces accès à tout moment. Un agent ne peut gérer que les biens qu’il a lui-même créés.</p>
          <PermissionChecklist disabled={role === "admin"} onChange={setPermissions} value={permissions} />
        </fieldset>
        <button disabled={submission.status === "submitting"} type="submit">
          <UserPlus size={18} aria-hidden="true" />
          {submission.status === "submitting" ? "Création…" : "Créer l’accès"}
        </button>
      </form>
    </>
  );
}
