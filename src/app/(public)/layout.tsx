import type { ReactNode } from "react";
import { PublicFooter } from "@/components/public-site/PublicFooter";
import { PublicHeader } from "@/components/public-site/PublicHeader";
import styles from "@/components/public-site/public-site.module.css";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.site}>
      <PublicHeader />
      <div className={styles.content}>{children}</div>
      <PublicFooter />
    </div>
  );
}
