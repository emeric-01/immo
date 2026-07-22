"use client";

import Link from "next/link";
import { Menu, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./public-site.module.css";

const links = [
  { href: "/estimation", label: "Estimer" },
  { href: "/recherche", label: "Rechercher" },
  { href: "/biens", label: "Nos biens" },
  { href: "/agence-immobiliere", label: "Agences immobilières" },
  { href: "/contenus", label: "Contenus" },
  { href: "/prix-m2", label: "Nos secteurs" },
  { href: "/qui-sommes-nous", label: "Qui sommes-nous" },
  { href: "/parrainage", label: "Parrainage" },
] as const;

export function PublicMobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  return (
    <div className={styles.mobileMenu}>
      <button
        aria-controls="mobile-navigation"
        aria-expanded={open}
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        className={styles.menuButton}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        <span>Menu</span>
      </button>

      {open ? (
        <div className={styles.mobilePanel} id="mobile-navigation">
          <nav aria-label="Navigation mobile">
            {links.map((link) => (
              <Link href={link.href} key={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
          </nav>
          <Link className={styles.mobileAccount} href="/client" onClick={() => setOpen(false)}>
            <UserRound aria-hidden="true" size={18} /> Mon compte
          </Link>
        </div>
      ) : null}
    </div>
  );
}
