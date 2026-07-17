"use client";

import { useState } from "react";
import { ImagePlus, LoaderCircle } from "lucide-react";
import styles from "../properties.module.css";

const amenities = ["Terrasse", "Balcon", "Parking", "Garage", "Ascenseur", "Cave", "Jardin", "Piscine", "Vue mer", "Résidence sécurisée"];

async function optimizeImage(file: File) {
  if (!file.type.startsWith("image/") || file.size < 500_000) return file;
  try {
    const bitmap = await createImageBitmap(file); const max = 1800; const ratio = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas"); canvas.width = Math.round(bitmap.width * ratio); canvas.height = Math.round(bitmap.height * ratio);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", .82));
    bitmap.close(); return blob ? new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" }) : file;
  } catch { return file; }
}

export function PropertyForm() {
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [photos, setPhotos] = useState<File[]>([]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("Optimisation et envoi des photos…");
    const form = new FormData(event.currentTarget); form.delete("photos");
    for (const photo of photos) form.append("photos", await optimizeImage(photo));
    const response = await fetch("/api/admin/properties", { method: "POST", body: form }); const result = await response.json();
    if (!response.ok) { setMessage(result.error || "Création impossible."); setBusy(false); return; }
    window.location.href = `/admin/biens?created=${result.slug}`;
  }
  return (
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.formHeader}><div><span>Nouvelle annonce</span><h2>Créer une fiche bien</h2></div><select name="status"><option value="draft">Brouillon</option><option value="published">Publier immédiatement</option></select></div>
      <section><h3>Informations essentielles</h3><div className={styles.grid}>
        <label className={styles.wide}>Titre du bien<input name="title" required placeholder="Appartement T3 avec terrasse" /></label>
        <label>Ville<input name="city_name" required placeholder="Aix-en-Provence" /></label><label>Code postal<input name="postal_code" placeholder="13100" /></label>
        <label>Quartier<input name="neighborhood" placeholder="Les Platanes" /></label><label>Type<select name="property_type"><option value="apartment">Appartement</option><option value="house">Maison</option><option value="land">Terrain</option><option value="other">Autre</option></select></label>
        <label>Prix (€)<input name="price" type="number" required min="0" /></label><label>Surface (m²)<input name="surface_m2" type="number" min="0" step="0.1" /></label>
        <label>Pièces<input name="rooms" type="number" min="0" /></label><label>Chambres<input name="bedrooms" type="number" min="0" /></label>
        <label>Étage<input name="floor_label" placeholder="1er sur 3" /></label><label>Adresse<input name="address" placeholder="Masquée sur la fiche publique" /></label>
        <label className={styles.wide}>Accroche<input name="short_description" placeholder="Proche centre-ville, calme et lumineux" /></label>
        <label className={styles.wide}>Description<textarea name="description" rows={7} placeholder="Présentez le bien, ses volumes et son environnement…" /></label>
      </div></section>
      <section><h3>Photos</h3><label className={styles.dropzone}><ImagePlus /><strong>Ajouter les photos</strong><span>JPG, PNG ou WebP — compression automatique avant envoi</span><input accept="image/jpeg,image/png,image/webp" multiple name="photos" onChange={(e) => setPhotos(Array.from(e.target.files ?? []))} type="file" /></label>{photos.length ? <p className={styles.photoCount}>{photos.length} photo{photos.length > 1 ? "s" : ""} sélectionnée{photos.length > 1 ? "s" : ""}. La première sera la couverture.</p> : null}</section>
      <section><h3>Caractéristiques</h3><div className={styles.grid}>
        <label>Terrasse (m²)<input name="terrace_m2" type="number" min="0" /></label><label>Exposition<input name="exposure" placeholder="Sud-Ouest" /></label>
        <label>Chauffage<input name="heating" placeholder="Individuel gaz" /></label><label>Année de construction<input name="construction_year" type="number" /></label>
        <label>Charges / mois<input name="condominium_charges_monthly" type="number" /></label><label>Taxe foncière / an<input name="property_tax_annual" type="number" /></label>
        <label>Lots de copropriété<input name="condominium_lots" type="number" /></label><label>DPE<select name="energy_rating"><option value="">Non renseigné</option>{["A","B","C","D","E","F","G"].map(v => <option key={v}>{v}</option>)}</select></label>
        <label className={styles.wide}>Stationnement<input name="parking_details" placeholder="Parking en sous-sol" /></label>
      </div><div className={styles.checks}>{amenities.map(item => <label key={item}><input name="amenities" type="checkbox" value={item} />{item}</label>)}</div></section>
      <section><h3>Contact</h3><div className={styles.grid}><label>Nom<input name="contact_name" defaultValue="Les Jumelles Immo" /></label><label>Téléphone<input name="contact_phone" /></label><label>Email<input name="contact_email" type="email" /></label><label>Honoraires à la charge de<select name="fees_paid_by"><option>Vendeur</option><option>Acquéreur</option></select></label></div></section>
      <div className={styles.actions}><p aria-live="polite">{message}</p><button disabled={busy} type="submit">{busy ? <LoaderCircle className={styles.spin} /> : null} Enregistrer le bien</button></div>
    </form>
  );
}
