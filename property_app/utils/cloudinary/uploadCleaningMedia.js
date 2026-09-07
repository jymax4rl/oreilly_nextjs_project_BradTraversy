import cloudinary from "./cloudinary.js";
import { assertSafeMongoId, sanitizeUploadFilename } from "./generateFolderPath.js";

const DEFAULT_UPLOAD_OPTIONS = {
  overwrite: false,
  unique_filename: true,
  use_filename: true,
};

export const CLEANING_PHOTO_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export const CLEANING_AUDIO_MIMES = new Set([
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/x-m4a",
  "audio/aac",
]);

export const MAX_CLEANING_PHOTO_BYTES = 8 * 1024 * 1024;
export const MAX_CLEANING_AUDIO_BYTES = 15 * 1024 * 1024;

/** Dedicated folder — do not reuse listing image/audio allow-lists. */
export function cleaningJobFolder(hostId, jobId, kind) {
  const safeHostId = assertSafeMongoId(hostId, "hostId");
  const safeJobId = assertSafeMongoId(jobId, "jobId");
  if (kind !== "photos" && kind !== "audio") {
    throw new Error("Invalid cleaning media folder");
  }
  return `kama-properties/hosts/${safeHostId}/cleanings/${safeJobId}/${kind}`;
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

export async function uploadCleaningPhoto({
  buffer,
  filename,
  hostId,
  jobId,
}) {
  const folder = cleaningJobFolder(hostId, jobId, "photos");
  const result = await uploadBuffer(buffer, {
    folder,
    resource_type: "image",
    filename_override: sanitizeUploadFilename(filename),
  });
  return {
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type || "image",
    fileSize: result.bytes || buffer.length,
    mimeType: result.format ? `image/${result.format}` : "",
    uploadedAt: new Date(),
  };
}

export async function uploadCleaningAudio({
  buffer,
  filename,
  hostId,
  jobId,
  mimeType,
  duration,
}) {
  const folder = cleaningJobFolder(hostId, jobId, "audio");
  const result = await uploadBuffer(buffer, {
    folder,
    resource_type: "video",
    filename_override: sanitizeUploadFilename(filename),
  });
  return {
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type || "video",
    fileSize: result.bytes || buffer.length,
    mimeType: mimeType || result.format || "audio/webm",
    duration: duration ?? result.duration ?? null,
    uploadedAt: new Date(),
  };
}
