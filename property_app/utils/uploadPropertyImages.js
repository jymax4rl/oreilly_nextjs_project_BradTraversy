import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { put } from "@vercel/blob";

function cloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

async function uploadToCloudinary(buffer, filename) {
  configureCloudinary();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "kama-properties/listings",
        public_id: filename.replace(/\.[^.]+$/, ""),
        resource_type: "image",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      },
    );
    stream.end(buffer);
  });
}

async function uploadToVercelBlob(buffer, filename, contentType) {
  const blob = await put(`listings/${filename}`, buffer, {
    access: "public",
    contentType: contentType || "image/jpeg",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  return blob.url;
}

async function uploadToLocalDisk(buffer, filename) {
  const imageDir = path.join(process.cwd(), "public/images/properties");
  await mkdir(imageDir, { recursive: true });
  const filePath = path.join(imageDir, filename);
  await writeFile(filePath, buffer);
  return filename;
}

/**
 * Upload listing images for serverless (Cloudinary / Vercel Blob) or local dev disk.
 * Returns URL strings (https://...) or local filenames for legacy paths.
 */
export async function uploadPropertyImages(files) {
  const urls = [];

  for (const file of files) {
    if (!file || file.size === 0 || !file.name) continue;

    const byteData = await file.arrayBuffer();
    const buffer = Buffer.from(byteData);
    const filename = `${Date.now()}_${file.name.replace(/\s/g, "_")}`;

    if (cloudinaryConfigured()) {
      urls.push(await uploadToCloudinary(buffer, filename));
      continue;
    }

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      urls.push(await uploadToVercelBlob(buffer, filename, file.type));
      continue;
    }

    if (process.env.VERCEL) {
      throw new Error(
        "Image upload is not configured for production. Add Cloudinary (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) or Vercel Blob (BLOB_READ_WRITE_TOKEN) in your environment variables.",
      );
    }

    urls.push(await uploadToLocalDisk(buffer, filename));
  }

  return urls;
}
