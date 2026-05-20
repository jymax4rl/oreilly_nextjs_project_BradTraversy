import cloudinary from "./cloudinary.js";

/**
 * Signed params for direct browser → Cloudinary uploads (bypasses Vercel body limits).
 * @param {string} folder
 * @param {"image" | "video"} [resourceType]
 */
export function createSignedUploadParams(folder, resourceType = "image") {
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = { timestamp, folder };
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    cloudinary.config().api_secret,
  );
  const publicConfig = {
    cloudName: cloudinary.config().cloud_name,
    apiKey: cloudinary.config().api_key,
  };

  return {
    ...publicConfig,
    timestamp,
    signature,
    folder,
    resourceType,
  };
}
