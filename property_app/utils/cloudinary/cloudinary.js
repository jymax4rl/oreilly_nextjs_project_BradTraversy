import { v2 as cloudinary } from "cloudinary";

/**
 * Secure Cloudinary client. Prefer CLOUDINARY_URL; otherwise individual env vars.
 */
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ secure: true });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export function isCloudinaryConfigured() {
  if (process.env.CLOUDINARY_URL) return true;
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

export { cloudinary };
export default cloudinary;
