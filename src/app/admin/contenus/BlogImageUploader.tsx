"use client";

import { useId, useState } from "react";
import { ImagePlus, LoaderCircle } from "lucide-react";
import {
  formatImageBytes,
  optimizeBlogImage,
  type OptimizedBlogImage,
} from "@/lib/content/client-image-optimizer";
import admin from "../admin.module.css";

export type UploadedBlogImage = {
  bytes: number;
  fileName: string;
  height: number;
  originalBytes: number;
  url: string;
  width: number;
};

type BlogImageUploaderProps = {
  altText: string;
  label: string;
  onUploaded: (image: UploadedBlogImage) => void;
};

export function BlogImageUploader({ altText, label, onUploaded }: BlogImageUploaderProps) {
  const inputId = useId();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function upload(file: File) {
    setBusy(true);
    setError("");
    setMessage("Optimisation de la photo…");

    try {
      const optimized = await optimizeBlogImage(file);
      setMessage(`Envoi de ${formatImageBytes(optimized.file.size)}…`);
      const image = await sendImage(optimized);
      setMessage(`${formatImageBytes(image.originalBytes)} → ${formatImageBytes(image.bytes)} · ${image.fileName}`);
      onUploaded(image);
    } catch (uploadError) {
      setMessage("");
      setError(uploadError instanceof Error ? uploadError.message : "Envoi impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={admin.blogImageUploader}>
      <label className={admin.blogUploadButton} aria-disabled={busy} htmlFor={inputId}>
        {busy ? <LoaderCircle className={admin.spin} size={18} /> : <ImagePlus size={18} />}
        {busy ? "Optimisation en cours…" : label}
      </label>
      <input
        accept="image/jpeg,image/png,image/webp"
        className={admin.visuallyHidden}
        disabled={busy}
        id={inputId}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void upload(file);
        }}
        type="file"
      />
      <p>Renommez votre fichier avant l’envoi : son nom sera conservé dans l’URL SEO, puis converti en WebP. Un suffixe court est ajouté uniquement en cas de doublon.</p>
      {message ? <p className={admin.uploadSuccess}>{message}</p> : null}
      {error ? <p className={admin.uploadError} role="alert">{error}</p> : null}
      {!altText.trim() ? <p className={admin.uploadWarning}>Pensez à renseigner un texte alternatif descriptif pour le SEO.</p> : null}
    </div>
  );
}

async function sendImage(optimized: OptimizedBlogImage): Promise<UploadedBlogImage> {
  const formData = new FormData();
  formData.set("image", optimized.file);
  formData.set("width", String(optimized.width));
  formData.set("height", String(optimized.height));
  formData.set("originalBytes", String(optimized.originalBytes));

  const response = await fetch("/api/admin/contenus/images", {
    body: formData,
    method: "POST",
  });
  const result = await response.json() as UploadedBlogImage & { error?: string };

  if (!response.ok) {
    throw new Error(result.error || "Envoi impossible.");
  }

  return result;
}
