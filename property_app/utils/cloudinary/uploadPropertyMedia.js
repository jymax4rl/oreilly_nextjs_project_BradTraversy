import cloudinary from "./cloudinary.js";
import { propertyFolder, sanitizeUploadFilename } from "./generateFolderPath.js";

const DEFAULT_UPLOAD_OPTIONS = {
  overwrite: false,
  unique_filename: true,
  use_filename: true,
};

/**
 * AI-enhancement eager transformations applied at upload time.
 *
 * Chain:
 *  1. e_gen_restore  – Generative AI restoration (removes noise, sharpens detail)
 *  2. e_enhance      – Perceptual colour / lighting enhancement
 *  3. q_auto:best / f_auto – Optimal quality + format for delivery
 *
 * Because these run *eagerly* (server-side at upload), delivery URLs are served
 * from Cloudinary's CDN without any per-request transformation cost.
 *
 * Set CLOUDINARY_SKIP_AI_ENHANCE=true to disable (e.g. in local dev to save
 * Cloudinary credits when uploading test images).
 */
function aiEnhanceEager() {
  if (process.env.CLOUDINARY_SKIP_AI_ENHANCE === "true") return undefined;
  return [
    { effect: "gen_restore" },
    { effect: "enhance" },
    { quality: "auto:best", fetch_format: "auto" },
  ];
}

export async function uploadPropertyImage({
  buffer,
  filename,
  hostId,
  propertyId,
  subfolder = "images",
}) {
  const folder = propertyFolder(hostId, propertyId, subfolder);
  const eager = aiEnhanceEager();
  const result = await uploadBuffer(buffer, {
    folder,
    resource_type: "image",
    filename_override: sanitizeUploadFilename(filename),
    ...(eager ? { eager, eager_async: false } : {}),
  });
  // Prefer the eagerly-transformed version when available.
  return toImageEntry(result);
}

function uploadBuffer(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        ...DEFAULT_UPLOAD_OPTIONS,
        secure: true,
        ...options,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
    stream.end(buffer);
  });
}

function toImageEntry(result) {
  // When eager transformations ran, Cloudinary returns them in result.eager[].
  // Use the first eager URL so guests see the AI-enhanced version.
  const eagerUrl = result.eager?.[0]?.secure_url;
  return {
    url: eagerUrl || result.secure_url,
    originalUrl: result.secure_url,   // keep raw URL for reference / future re-processing
    publicId: result.public_id,
    resourceType: result.resource_type || "image",
    uploadedAt: new Date(),
  };
}

/** Cloudinary stores audio under resource_type video (or auto). */
export async function uploadPropertyAudio({
  buffer,
  filename,
  hostId,
  propertyId,
}) {
  const folder = propertyFolder(hostId, propertyId, "audio");
  const result = await uploadBuffer(buffer, {
    folder,
    resource_type: "video",
    filename_override: sanitizeUploadFilename(filename),
  });
  return {
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type || "video",
    uploadedAt: new Date(),
  };
}
