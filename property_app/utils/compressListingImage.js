/** Vercel serverless request body limit is ~4.5MB — keep listing uploads under that. */
export const MAX_LISTING_UPLOAD_BYTES = 4_000_000;
export const MAX_LISTING_IMAGES = 10;

/**
 * Downscale/re-encode a photo for serverless upload.
 * Returns a JPEG File (or the original if already small / non-image).
 */
export async function compressListingImage(file, options = {}) {
  const maxEdge = options.maxEdge ?? 1600;
  const quality = options.quality ?? 0.82;
  const maxBytes = options.maxBytes ?? 900_000;

  if (!file || !(file instanceof Blob)) return file;
  if (!String(file.type || "").startsWith("image/")) return file;
  if (file.size <= maxBytes && file.size < 400_000) return asNamedFile(file);

  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return asNamedFile(file);
    ctx.drawImage(bitmap, 0, 0, width, height);

    let q = quality;
    let blob = await canvasToJpeg(canvas, q);
    while (blob && blob.size > maxBytes && q > 0.5) {
      q -= 0.08;
      blob = await canvasToJpeg(canvas, q);
    }
    if (!blob) return asNamedFile(file);
    const base = String(file.name || "photo")
      .replace(/\.[^.]+$/, "")
      .replace(/\s+/g, "_")
      .slice(0, 80);
    return new File([blob], `${base || "photo"}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close?.();
  }
}

function canvasToJpeg(canvas, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality);
  });
}

function asNamedFile(file) {
  if (file instanceof File && file.name) return file;
  const name = file.name || `photo_${Date.now()}.jpg`;
  return new File([file], name, {
    type: file.type || "image/jpeg",
    lastModified: Date.now(),
  });
}

export async function compressListingImages(files) {
  const list = Array.from(files || []).slice(0, MAX_LISTING_IMAGES);
  const out = [];
  for (const file of list) {
    out.push(await compressListingImage(file));
  }
  return out;
}

export function totalBytes(files) {
  return Array.from(files || []).reduce((sum, f) => sum + (f?.size || 0), 0);
}
