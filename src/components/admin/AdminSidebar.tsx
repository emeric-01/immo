import Link from "next/link";
import type { AdminSession } from "@/lib/admin/auth";
import { getAdminPermissions, type AdminPermission } from "@/lib/admin/permissions";
import styles from "@/app/admin/admin.module.css";

const menuItems: Array<{ href: string; label: string; permission?: AdminPermission }> = [
  { href: "/admin/biens", label: "Biens", permission: "properties:read" },
  { href: "/admin/recherches", label: "Recherches", permission: "buyer_searches:read" },
  { href: "/admin/estimations", label: "Estimations", permission: "estimations:read" },
  { href: "/admin/dossiers-estimation", label: "Dossiers d’estimation", permission: "estimations:read" },
  { href: "/admin/parrainages", label: "Parrainages", permission: "referrals:read" },
  { href: "/admin/clients", label: "Clients", permission: "clients:read" },
  { href: "/admin/recherches-villes", label: "Villes recherchées", permission: "city_searches:read" },
  { href: "/admin/audience", label: "Audience", permission: "audience:read" },
  { href: "/admin/contenus", label: "Contenus", permission: "contents:read" },
  { href: "/admin/utilisateurs", label: "Utilisateurs", permission: "users:manage" },
  { href: "/admin/mon-compte", label: "Mon compte" },
];

export async function AdminSidebar({ active, session }: { active: string; session: AdminSession }) {
  const permissions = await getAdminPermissions(session);
  const visibleItems = menuItems.filter((item) => !item.permission || permissions.includes(item.permission));

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brandMark}><span>les jumelles</span><strong>IMMO</strong></div>
      <nav>
        {visibleItems.map((item) => (
          <Link data-active={active === item.href ? "" : undefined} href={item.href} key={item.href}>{item.label}</Link>
        ))}
      </nav>
    </aside>
  );
}
