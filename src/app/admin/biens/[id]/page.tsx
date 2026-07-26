import Image from "next/image";
import { BarChart3 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/admin/auth";
import { hasAdminPermission } from "@/lib/admin/permissions";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { getAdminProperty } from "@/lib/properties";
import { PropertyForm } from "../PropertyForm";
import admin from "../../admin.module.css";
export const dynamic="force-dynamic";
export default async function EditPropertyPage({params}:{params:Promise<{id:string}>}){const session=await requireAdminSession();const property=await getAdminProperty((await params).id).catch(()=>null);if(!property)notFound();const canManageAll=await hasAdminPermission(session,"properties:write");const canUpdateOwn=await hasAdminPermission(session,"properties:update_own");if(!canManageAll&&!(canUpdateOwn&&property.created_by_admin_id===session.id))notFound();return <main className={admin.adminPage}><AdminSidebar active="/admin/biens" session={session}/><section className={admin.content}><header className={admin.pageHeader}><div><p className={admin.eyebrow}>Modifier un bien</p><h1>{property.title}</h1><p>Les changements d’un bien publié apparaissent immédiatement en ligne.</p></div><div className={admin.headerActions}><Link className={admin.secondaryButton} href={`/admin/biens/${property.id}/statistiques`}><BarChart3 aria-hidden="true" size={18}/> Statistiques</Link><a className={admin.secondaryButton} href={`/admin/api/properties/${property.id}/pdf`} target="_blank"><Image alt="" aria-hidden="true" height={18} src="/icons/pdf.svg" width={18}/> Fiche PDF</a><Link className={admin.secondaryButton} href={`/biens/${property.slug}`} target="_blank">Prévisualiser</Link></div></header><PropertyForm property={property}/></section></main>}
