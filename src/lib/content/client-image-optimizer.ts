export const BLOG_IMAGE_MAX_SOURCE_BYTES = 20 * 1024 * 1024;
export const BLOG_IMAGE_TARGET_BYTES = 450 * 1024;
export const BLOG_IMAGE_UPLOAD_LIMIT_BYTES = 1024 * 1024;

const MAX_DIMENSION = 1800;
const MIN_DIMENSION = 720;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type OptimizedBlogImage = {
  file: File;
  height: number;
  originalBytes: number;
  width: number;
};

export async function optimizeBlogImage(file: File): Promise<OptimizedBlogImage> {
  if (!ACCEPTED_TYPES.has(file.type)) {
    throw new Error("Choisissez une image JPG, PNG ou WebP.");
  }

  if (file.size > BLOG_IMAGE_MAX_SOURCE_BYTES) {
    throw new Error("La photo source dépasse 20 Mo.");
  }

  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });

  try {
    let { width, height } = constrainDimensions(bitmap.width, bitmap.height, MAX_DIMENSION);
    let blob: Blob | null = null;

    for (let scaleAttempt = 0; scaleAttempt < 5; scaleAttempt += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { alpha: true });

      if (!context) {
        throw new Error("Votre navigateur ne permet pas d’optimiser cette photo.");
      }

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(bitmap, 0, 0, width, height);

      for (const quality of [0.84, 0.78, 0.72, 0.66, 0.6, 0.54]) {
        blob = await canvasToBlob(canvas, quality);

        if (blob.size <= BLOG_IMAGE_TARGET_BYTES) {
          break;
        }
      }

      if (blob && blob.size <= BLOG_IMAGE_TARGET_BYTES) {
        break;
      }

      const nextDimensions = scaleDownDimensions(width, height);
      const nextWidth = nextDimensions.width;
      const nextHeight = nextDimensions.height;

      if (nextWidth === width && nextHeight === height) {
        break;
      }

      width = nextWidth;
      height = nextHeight;
    }

    if (!blob || blob.size > BLOG_IMAGE_UPLOAD_LIMIT_BYTES) {
      throw new Error("Cette photo reste trop lourde après optimisation. Choisissez une image moins grande.");
    }

    return {
      file: new File([blob], `${createSeoImageBaseName(file.name)}.webp`, {
        lastModified: Date.now(),
        type: "image/webp",
      }),
      height,
      originalBytes: file.size,
      width,
    };
  } finally {
    bitmap.close();
  }
}

function scaleDownDimensions(width: number, height: number) {
  const longestSide = Math.max(width, height);

  if (longestSide <= MIN_DIMENSION) {
    return { height, width };
  }

  const ratio = Math.max(0.84, MIN_DIMENSION / longestSide);

  return {
    height: Math.max(1, Math.round(height * ratio)),
    width: Math.max(1, Math.round(width * ratio)),
  };
}

export function formatImageBytes(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo`;
  }

  return `${Math.max(1, Math.round(bytes / 1024)).toLocaleString("fr-FR")} Ko`;
}

function constrainDimensions(width: number, height: number, maxDimension: number) {
  const ratio = Math.min(1, maxDimension / Math.max(width, height));

  return {
    height: Math.max(1, Math.round(height * ratio)),
    width: Math.max(1, Math.round(width * ratio)),
  };
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("La conversion WebP a échoué."));
      }
    }, "image/webp", quality);
  });
}

export function createSeoImageBaseName(name: string) {
  const fileName = name.split(/[\\/]/).pop() || name;
  const baseName = fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉]/g, (digit) => unicodeDigitMap[digit] || digit);
  const normalized = baseName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90)
    .replace(/-$/g, "");

  return normalized || "image-article";
}

const unicodeDigitMap: Record<string, string> = {
  "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4",
  "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9",
  "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4",
  "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9",
};
