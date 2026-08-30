import cloudinary, { isCloudinaryConfigured } from "./cloudinary.js";
import {
  sanitizeUploadFilename,
  userAvatarFolder,
} from "./generateFolderPath.js";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Upload a square-friendly profile photo to Cloudinary.
 * Overwrites the same public_id so re-uploads don't orphan files.
 *
 * @returns {Promise<{ url: string, publicId: string }>}
 */
export async function uploadUserAvatar({ buffer, filename, userId, mimeType }) {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured");
  }
  if (!ALLOWED_MIME.has(mimeType)) {
    throw new Error("Avatar must be JPEG, PNG, WebP, or GIF");
  }
  if (!buffer?.length) {
    throw new Error("Empty file");
  }
  if (buffer.length > MAX_BYTES) {
    throw new Error("Avatar must be 5 MB or smaller");
  }

  const folder = userAvatarFolder(userId);
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: "profile",
        overwrite: true,
        invalidate: true,
        resource_type: "image",
        filename_override: sanitizeUploadFilename(filename || "avatar"),
        transformation: [
          { width: 400, height: 400, crop: "fill", gravity: "face" },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
      (error, res) => {
        if (error) reject(error);
        else resolve(res);
      },
    );
    stream.end(buffer);
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}

export { ALLOWED_MIME, MAX_BYTES };
