import "server-only";

export type ValidatedImageType = "image/jpeg" | "image/png" | "image/webp";

const imageExtensions: Record<ValidatedImageType, "jpg" | "png" | "webp"> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export class ImageUploadValidationError extends Error {}

export async function validateImageUpload(file: File, maximumBytes: number) {
  if (!Object.hasOwn(imageExtensions, file.type)) {
    throw new ImageUploadValidationError("Format accepté : JPG, PNG ou WebP.");
  }

  if (file.size <= 0 || file.size > maximumBytes) {
    throw new ImageUploadValidationError(`Chaque photo doit peser moins de ${Math.round(maximumBytes / (1024 * 1024))} Mo.`);
  }

  const contentType = file.type as ValidatedImageType;
  const bytes = new Uint8Array(await file.arrayBuffer());

  if (!matchesDeclaredImageType(bytes, contentType)) {
    throw new ImageUploadValidationError("Le contenu du fichier ne correspond pas à un format d’image accepté.");
  }

  return {
    bytes,
    contentType,
    extension: imageExtensions[contentType],
  };
}

function matchesDeclaredImageType(bytes: Uint8Array, contentType: ValidatedImageType) {
  if (contentType === "image/jpeg") {
    return bytes.length >= 3
      && bytes[0] === 0xff
      && bytes[1] === 0xd8
      && bytes[2] === 0xff;
  }

  if (contentType === "image/png") {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return bytes.length >= signature.length
      && signature.every((value, index) => bytes[index] === value);
  }

  return bytes.length >= 12
    && ascii(bytes, 0, 4) === "RIFF"
    && ascii(bytes, 8, 12) === "WEBP";
}

function ascii(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.slice(start, end));
}
