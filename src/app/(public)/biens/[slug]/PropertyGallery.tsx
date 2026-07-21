"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./property.module.css";

type GalleryImage = { id: string; public_url: string; alt_text: string | null };

export function PropertyGallery({ images, title, isExclusive = false }: { images: GalleryImage[]; title: string; isExclusive?: boolean }) {
  const [selected, setSelected] = useState<number | null>(null);
  const close = () => setSelected(null);
  const previous = () => setSelected(current => current === null ? null : (current - 1 + images.length) % images.length);
  const next = () => setSelected(current => current === null ? null : (current + 1) % images.length);

  useEffect(() => {
    if (selected === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
      if (event.key === "ArrowLeft") setSelected(current => current === null ? null : (current - 1 + images.length) % images.length);
      if (event.key === "ArrowRight") setSelected(current => current === null ? null : (current + 1) % images.length);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selected, images.length]);

  return <>
    <div className={styles.gallery}>
      <button aria-label="Voir toutes les photos" className={styles.mainImage} onClick={() => setSelected(0)} type="button">
        <Image alt={images[0].alt_text || title} fill priority sizes="(max-width: 900px) 100vw, 58vw" src={images[0].public_url}/>
        {isExclusive ? <em className={styles.galleryExclusive}>Exclusivité Les Jumelles</em> : null}
        <span>1 / {images.length}</span><strong><Images/> Voir les {images.length} photos</strong>
      </button>
      <div className={styles.thumbs}>{images.slice(1,4).map((image, index) => <button aria-label={`Voir la photo ${index + 2}`} key={image.id} onClick={() => setSelected(index + 1)} type="button"><Image alt={image.alt_text || title} fill sizes="20vw" src={image.public_url}/>{index === 2 && images.length > 4 ? <span>+{images.length - 4}</span> : null}</button>)}</div>
    </div>
    <div aria-label={`Galerie de ${images.length} photos, faites défiler horizontalement`} className={styles.mobileGallery}>{images.map((image, index) => <figure key={image.id}><Image alt={image.alt_text || `${title} — photo ${index + 1}`} fill priority={index === 0} sizes="100vw" src={image.public_url}/>{isExclusive && index === 0 ? <em className={styles.galleryExclusive}>Exclusivité Les Jumelles</em> : null}<span>{index + 1} / {images.length}</span></figure>)}</div>
    {selected !== null ? <div aria-label="Galerie photos" aria-modal="true" className={styles.lightbox} role="dialog" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
      <header><span>{selected + 1} / {images.length}</span><button aria-label="Fermer" onClick={close} type="button"><X/></button></header>
      {images.length > 1 ? <button aria-label="Photo précédente" className={styles.lightboxPrevious} onClick={previous} type="button"><ChevronLeft/></button> : null}
      <div className={styles.lightboxImage}><Image alt={images[selected].alt_text || `${title} — photo ${selected + 1}`} fill priority sizes="100vw" src={images[selected].public_url}/></div>
      {images.length > 1 ? <button aria-label="Photo suivante" className={styles.lightboxNext} onClick={next} type="button"><ChevronRight/></button> : null}
      <div className={styles.lightboxThumbs}>{images.map((image, index) => <button aria-current={index === selected} aria-label={`Afficher la photo ${index + 1}`} key={image.id} onClick={() => setSelected(index)} type="button"><Image alt="" fill sizes="96px" src={image.public_url}/></button>)}</div>
    </div> : null}
  </>;
}
