import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdminSession } from "@/lib/admin/auth";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { PropertyForm } from "../PropertyForm";
import admin from "../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function NewPropertyPage() {
  const session = await requireAdminSession();
  await requireAdminPermission(session, "properties:create");
  return <main className={admin.adminPage}>
    <AdminSidebar active="/admin/biens" session={session}/>
    <section className={admin.content}><header className={admin.pageHeader}><div><p className={admin.eyebrow}>Nouvelle annonce</p><h1>Ajouter un bien</h1><p>Complétez les informations puis enregistrez la fiche en brouillon ou publiez-la.</p></div><Link className={admin.secondaryButton} href="/admin/biens"><ArrowLeft size={17}/> Retour à la liste</Link></header><PropertyForm /></section>
  </main>;
}
