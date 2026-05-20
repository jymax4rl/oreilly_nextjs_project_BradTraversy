/**
 * Upload files straight from the browser to Cloudinary (not through Vercel).
 * @param {File | Blob} file
 * @param {object} params from createSignedUploadParams
 */
export async function uploadFileToCloudinary(file, params) {
  const resourceType = params.resourceType === "video" ? "video" : "image";
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", params.apiKey);
  formData.append("timestamp", String(params.timestamp));
  formData.append("signature", params.signature);
  formData.append("folder", params.folder);

  const endpoint = `https://api.cloudinary.com/v1_1/${params.cloudName}/${resourceType}/upload`;
  const res = await fetch(endpoint, { method: "POST", body: formData });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Cloudinary upload failed (${res.status})`);
  }

  return res.json();
}

/** @param {object} result Cloudinary upload API response */
export function cloudinaryResultToImageEntry(result) {
  return {
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type || "image",
    uploadedAt: new Date().toISOString(),
  };
}

/** @param {object} result Cloudinary upload API response */
export function cloudinaryResultToAudioEntry(result) {
  return {
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type || "video",
  };
}
