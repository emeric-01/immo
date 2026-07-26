"use client";

import { useState } from "react";
import type { AdminPermission } from "@/lib/admin/permission-definitions";
import styles from "../admin.module.css";
import { PermissionChecklist } from "./PermissionChecklist";

export function AdminUserPermissionsForm({ initialPermissions, userId }: { initialPermissions: AdminPermission[]; userId: string }) {
  const [permissions, setPermissions] = useState(initialPermissions);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save() {
    setStatus("saving");
    const response = await fetch(`/api/admin/users/${userId}/permissions`, {
      body: JSON.stringify({ permissions }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    setStatus(response.ok ? "saved" : "error");
  }

  return (
    <details className={styles.permissionEditor}>
      <summary>Gérer les accès</summary>
      <PermissionChecklist onChange={(next) => { setPermissions(next); setStatus("idle"); }} value={permissions} />
      <div className={styles.permissionActions}>
        <button disabled={status === "saving"} onClick={save} type="button">{status === "saving" ? "Enregistrement…" : "Enregistrer les accès"}</button>
        {status === "saved" ? <small>Accès enregistrés.</small> : null}
        {status === "error" ? <small data-error>Enregistrement impossible.</small> : null}
      </div>
    </details>
  );
}
