/** Max longest edge (px) for listing uploads — keeps multi-photo posts under Vercel body limits. */
const MAX_EDGE = 1920;
const JPEG_QUALITY = 0.82;
const SKIP_BELOW_BYTES = 350_000;

/**
 * Resize/compress a picked image in the browser before FormData upload.
 * Falls back to the original file when compression is unavailable (e.g. some HEIC).
 * @param {File} file
 * @returns {Promise<File>}
 */
export async function compressListingImage(file) {
  if (!file?.type?.startsWith("image/") || file.size < SKIP_BELOW_BYTES) {
    return file;
  }

  if (typeof createImageBitmap !== "function") {
    return file;
  }

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  try {
    const longest = Math.max(bitmap.width, bitmap.height);
    const scale = longest > MAX_EDGE ? MAX_EDGE / longest : 1;
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
    });

    if (!blob || blob.size >= file.size) {
      return file;
    }

    const baseName =
      (file.name || "photo").replace(/\.[^.]+$/, "").replace(/[/\\]/g, "_") ||
      "photo";

    return new File([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close?.();
  }
}
