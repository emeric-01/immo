"use client";

import { adminPermissionOptions, type AdminPermission } from "@/lib/admin/permission-definitions";
import styles from "../admin.module.css";

export function PermissionChecklist({
  disabled = false,
  onChange,
  value,
}: {
  disabled?: boolean;
  onChange: (permissions: AdminPermission[]) => void;
  value: AdminPermission[];
}) {
  function toggle(permission: AdminPermission) {
    const next = value.includes(permission) ? value.filter((item) => item !== permission) : [...value, permission];
    if (!next.includes("properties:read")) {
      onChange(next.filter((item) => !["properties:create", "properties:update_own", "properties:write"].includes(item)));
      return;
    }
    if (!next.includes("contents:read")) {
      onChange(next.filter((item) => item !== "contents:write"));
      return;
    }
    onChange(next);
  }

  return (
    <div className={styles.permissionGrid}>
      {adminPermissionOptions.map((option) => (
        <label className={styles.permissionOption} key={option.permission}>
          <input
            checked={value.includes(option.permission)}
            disabled={disabled}
            onChange={() => toggle(option.permission)}
            type="checkbox"
          />
          <span><strong>{option.label}</strong><small>{option.description}</small></span>
        </label>
      ))}
    </div>
  );
}
