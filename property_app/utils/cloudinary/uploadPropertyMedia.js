import cloudinary from "./cloudinary.js";
import { propertyFolder, sanitizeUploadFilename } from "./generateFolderPath.js";

const DEFAULT_UPLOAD_OPTIONS = {
  overwrite: false,
  unique_filename: true,
  use_filename: true,
};

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
