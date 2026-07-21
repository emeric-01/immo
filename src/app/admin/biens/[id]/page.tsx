import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/admin/auth";
import { getAdminProperty } from "@/lib/properties";
import { PropertyForm } from "../PropertyForm";
import admin from "../../admin.module.css";
export const dynamic="force-dynamic";
export default async function EditPropertyPage({params}:{params:Promise<{id:string}>}){await requireAdminSession();const property=await getAdminProperty((await params).id).catch(()=>null);if(!property)notFound();return <main className={admin.adminPage}><aside className={admin.sidebar}><div className={admin.brandMark}><span>les jumelles</span><strong>IMMO</strong></div><nav><Link data-active href="/admin/biens">Biens</Link><Link href="/admin/recherches">Recherches</Link><Link href="/admin/estimations">Estimations</Link><Link href="/admin/clients">Clients</Link><Link href="/admin/recherches-villes">Villes recherchées</Link><Link href="/admin/contenus">Contenus</Link></nav></aside><section className={admin.content}><header className={admin.pageHeader}><div><p className={admin.eyebrow}>Modifier un bien</p><h1>{property.title}</h1><p>Les changements d’un bien publié apparaissent immédiatement en ligne.</p></div><div className={admin.headerActions}><a className={admin.secondaryButton} href={`/admin/api/properties/${property.id}/pdf`} target="_blank"><Image alt="" aria-hidden="true" height={18} src="/icons/pdf.svg" width={18}/> Fiche PDF</a><Link className={admin.secondaryButton} href={`/biens/${property.slug}`} target="_blank">Prévisualiser</Link></div></header><PropertyForm property={property}/></section></main>}
