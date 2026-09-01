import Link from "next/link";
import { ArrowRight, UserRound } from "lucide-react";
import styles from "../admin/admin.module.css";

export default function ResponsivePreviewPage() {
  return (
    <main style={{ background: "#f7f5f2", minHeight: "100vh", padding: 10 }}>
      <div className={`${styles.tablePanel} ${styles.buyerSearchTable}`}>
        <table>
          <thead><tr><th>Client</th><th>Agent</th><th>Recherche</th><th>Budget</th><th>Cohérence</th><th>Contact</th><th>Statut</th><th aria-label="Détail" /></tr></thead>
          <tbody><tr>
            <td data-label="Client"><div className={styles.clientCell}><span><UserRound size={18}/></span><div><strong>Aurore Lions</strong><small>14 août 2026, 08:46</small><small>Créé dans l’espace client</small><small>Origine : google / organic</small></div></div></td>
            <td data-label="Agent"><strong>Sébastien Ledoyen</strong><small>sebastien@jumellesimmo.fr</small></td>
            <td data-label="Recherche"><strong>Maison</strong><small>Aubagne (20 km), La Seyne-sur-Mer (10 km), Nans-les-Pins (5 km)</small></td>
            <td data-label="Budget"><strong>300 000 €</strong><small>85 m² min.</small></td>
            <td data-label="Cohérence"><span className={styles.marketScoreBadge} data-score="positive">70/100</span></td>
            <td data-label="Contact"><strong>Par SMS, Par téléphone, Par email</strong><small>paulhan.aurore@gmail.com</small></td>
            <td data-label="Statut"><span className={styles.statusBadge} data-status="new">Nouveau</span></td>
            <td><Link aria-label="Ouvrir la recherche d’Aurore Lions" className={styles.iconLink} href="/"><ArrowRight size={18}/></Link></td>
          </tr></tbody>
        </table>
      </div>
    </main>
  );
}
