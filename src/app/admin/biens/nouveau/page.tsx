import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdminSession } from "@/lib/admin/auth";
import { PropertyForm } from "../PropertyForm";
import admin from "../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function NewPropertyPage() {
  await requireAdminSession();
  return <main className={admin.adminPage}>
    <aside className={admin.sidebar}><div className={admin.brandMark}><span>les jumelles</span><strong>IMMO</strong></div><nav><Link data-active href="/admin/biens">Biens</Link><Link href="/admin/recherches">Recherches</Link><Link href="/admin/estimations">Estimations</Link><Link href="/admin/clients">Clients</Link><Link href="/admin/recherches-villes">Villes recherchées</Link></nav></aside>
    <section className={admin.content}><header className={admin.pageHeader}><div><p className={admin.eyebrow}>Nouvelle annonce</p><h1>Ajouter un bien</h1><p>Complétez les informations puis enregistrez la fiche en brouillon ou publiez-la.</p></div><Link className={admin.secondaryButton} href="/admin/biens"><ArrowLeft size={17}/> Retour à la liste</Link></header><PropertyForm /></section>
  </main>;
}
