import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { hasAdminPermission } from "@/lib/admin/permissions";
import { BLOG_IMAGE_UPLOAD_LIMIT_BYTES } from "@/lib/content/client-image-optimizer";
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
    const path = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.webp`;
    const upload = await fetch(`${config.url}/storage/v1/object/blog-images/${path}`, {
      body: bytes,
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": "image/webp",
        "x-upsert": "false",
      },
      method: "POST",
    });

    if (!upload.ok) {
      throw new Error(await upload.text());
    }

    return NextResponse.json({
      bytes: image.size,
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

function isWebp(bytes: Uint8Array) {
  return bytes.length >= 12
    && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF"
    && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
}

function positiveInteger(value: FormDataEntryValue | null) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}
