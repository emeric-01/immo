import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { hasAdminPermission } from "@/lib/admin/permissions";
import {
  BLOG_IMAGE_UPLOAD_LIMIT_BYTES,
  createSeoImageBaseName,
} from "@/lib/content/client-image-optimizer";
import { getSupabaseAdminConfig } from "@/lib/properties";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getAdminSession();

  if (!session || !(await hasAdminPermission(session, "contents:write"))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const config = getSupabaseAdminConfig();

  if (!config) {
    return NextResponse.json({ error: "Configuration Supabase absente." }, { status: 503 });
  }

  try {
    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File) || image.size === 0) {
      return NextResponse.json({ error: "Aucune image reçue." }, { status: 400 });
    }

    if (image.type !== "image/webp" || image.size > BLOG_IMAGE_UPLOAD_LIMIT_BYTES) {
      return NextResponse.json({ error: "L’image optimisée doit être un WebP de moins de 1 Mo." }, { status: 400 });
    }

    const bytes = new Uint8Array(await image.arrayBuffer());

    if (!isWebp(bytes)) {
      return NextResponse.json({ error: "Le fichier reçu n’est pas une image WebP valide." }, { status: 400 });
    }

    const now = new Date();
    const folder = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    const baseName = createSeoImageBaseName(image.name);
    const path = await uploadWithSeoFilename(config, folder, baseName, bytes);

    return NextResponse.json({
      bytes: image.size,
      fileName: path.split("/").at(-1) || `${baseName}.webp`,
      height: positiveInteger(formData.get("height")),
      originalBytes: positiveInteger(formData.get("originalBytes")),
      url: `${config.url}/storage/v1/object/public/blog-images/${path}`,
      width: positiveInteger(formData.get("width")),
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Envoi impossible.",
    }, { status: 500 });
  }
}

async function uploadWithSeoFilename(
  config: { key: string; url: string },
  folder: string,
  baseName: string,
  bytes: Uint8Array,
) {
  const firstPath = `${folder}/${baseName}.webp`;
  const firstUpload = await uploadImage(config, firstPath, bytes);

  if (firstUpload.ok) {
    return firstPath;
  }

  const firstError = await firstUpload.text();

  if (firstUpload.status !== 409 && !/already exists|resource.*exists|duplicate/i.test(firstError)) {
    throw new Error(firstError);
  }

  const uniquePath = `${folder}/${baseName}-${crypto.randomUUID().slice(0, 8)}.webp`;
  const uniqueUpload = await uploadImage(config, uniquePath, bytes);

  if (!uniqueUpload.ok) {
    throw new Error(await uniqueUpload.text());
  }

  return uniquePath;
}

function uploadImage(config: { key: string; url: string }, path: string, bytes: Uint8Array) {
  const body = bytes.buffer instanceof ArrayBuffer
    ? bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    : Uint8Array.from(bytes).buffer;

  return fetch(`${config.url}/storage/v1/object/blog-images/${path}`, {
    body,
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": "image/webp",
      "x-upsert": "false",
    },
    method: "POST",
  });
}

function isWebp(bytes: Uint8Array) {
  return bytes.length >= 12
    && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF"
    && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
}

function positiveInteger(value: FormDataEntryValue | null) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}
