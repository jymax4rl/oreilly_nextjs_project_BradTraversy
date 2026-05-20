/**
 * Public Cloudinary identifiers safe to send to the browser (never the API secret).
 */
export function getCloudinaryPublicConfig() {
  const url = process.env.CLOUDINARY_URL;
  if (url?.startsWith("cloudinary://")) {
    const withoutScheme = url.replace("cloudinary://", "");
    const at = withoutScheme.lastIndexOf("@");
    if (at === -1) return null;
    const creds = withoutScheme.slice(0, at);
    const cloudName = withoutScheme.slice(at + 1);
    const colon = creds.indexOf(":");
    const apiKey = colon === -1 ? creds : creds.slice(0, colon);
    if (!cloudName || !apiKey) return null;
    return { cloudName, apiKey };
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  if (!cloudName || !apiKey) return null;
  return { cloudName, apiKey };
}
