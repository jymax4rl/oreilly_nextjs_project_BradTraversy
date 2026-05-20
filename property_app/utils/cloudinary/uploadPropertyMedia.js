import cloudinary from "./cloudinary.js";
import { propertyFolder, sanitizeUploadFilename } from "./generateFolderPath.js";

const DEFAULT_UPLOAD_OPTIONS = {
  overwrite: false,
  unique_filename: true,
  use_filename: true,
};

/**
 * @param {object} params
 * @param {Buffer} params.buffer
 * @param {string} params.filename
 * @param {string} params.hostId
 * @param {string} params.propertyId
 * @param {"images" | "audio" | "documents"} [params.subfolder]
 */
export async function uploadPropertyImage({
  buffer,
  filename,
  hostId,
  propertyId,
  subfolder = "images",
}) {
  const folder = propertyFolder(hostId, propertyId, subfolder);
  const result = await uploadBuffer(buffer, {
    folder,
    resource_type: "image",
    filename_override: sanitizeUploadFilename(filename),
  });
  return toImageEntry(result);
}

/**
 * @param {object} params
 * @param {Buffer} params.buffer
 * @param {string} params.filename
 * @param {string} params.hostId
 * @param {string} params.propertyId
 */
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
  return toAudioEntry(result);
}

/**
 * Upload from an existing HTTPS URL (backfill / remote migration).
 * Does not delete the source asset.
 * @param {object} params
 * @param {string} params.sourceUrl
 * @param {string} params.hostId
 * @param {string} params.propertyId
 * @param {"image" | "video"} [params.resourceType]
 * @param {"images" | "audio" | "documents"} [params.subfolder]
 */
export async function uploadPropertyMediaFromUrl({
  sourceUrl,
  hostId,
  propertyId,
  resourceType = "image",
  subfolder = "images",
}) {
  const folder = propertyFolder(hostId, propertyId, subfolder);
  const result = await cloudinary.uploader.upload(sourceUrl, {
    ...DEFAULT_UPLOAD_OPTIONS,
    folder,
    resource_type: resourceType,
    secure: true,
  });
  return resourceType === "video"
    ? toAudioEntry(result)
    : toImageEntry(result);
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
  return {
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type || "image",
    uploadedAt: new Date(),
  };
}

function toAudioEntry(result) {
  return {
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type || "video",
  };
}
