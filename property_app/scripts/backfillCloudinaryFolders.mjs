/**
 * Backfill property media into Cloudinary folder structure without deleting originals.
 * Usage: npm run db:backfill-cloudinary-folders
 *        npm run db:backfill-cloudinary-folders -- --dry-run
 */
import dns from "node:dns";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = join(__dirname, "..");
const dryRun = process.argv.includes("--dry-run");

function loadEnvFile(filename) {
  const envPath = join(appRoot, filename);
  if (!existsSync(envPath)) return;
  const raw = readFileSync(envPath, "utf8").replace(/^\uFEFF/, "");
  for (const line of raw.split(/\r?\n/)) {
    let trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (trimmed.startsWith("export ")) trimmed = trimmed.slice(7).trim();
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value && !process.env[key]) process.env[key] = value;
  }
}

function loadDotEnv() {
  loadEnvFile(".env");
  loadEnvFile(".env.local");
}

loadDotEnv();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI required in property_app/.env");
  process.exit(1);
}

const hasCloudinary =
  Boolean(process.env.CLOUDINARY_URL) ||
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );

if (!hasCloudinary) {
  console.error(
    "Cloudinary credentials required (CLOUDINARY_URL or CLOUDINARY_* vars)",
  );
  process.exit(1);
}

const { isCloudinaryConfigured } = await import(
  "../utils/cloudinary/cloudinary.js"
);
const { propertyFolder, propertyImagesFolder, hostRootFolder } = await import(
  "../utils/cloudinary/generateFolderPath.js"
);
const {
  uploadPropertyAudio,
  uploadPropertyImage,
  uploadPropertyMediaFromUrl,
} = await import("../utils/cloudinary/uploadPropertyMedia.js");
const { resolveLocalPropertyImagePath, resolveLocalPropertyAudioPath } =
  await import("../utils/cloudinary/localPropertyMedia.js");

if (!isCloudinaryConfigured()) {
  console.error("Cloudinary is not configured.");
  process.exit(1);
}

function isMigratedImageEntry(entry) {
  return (
    entry &&
    typeof entry === "object" &&
    entry.url &&
    entry.publicId &&
    String(entry.publicId).startsWith("kama-properties/hosts/")
  );
}

function isMigratedAudioEntry(audio) {
  return (
    audio &&
    typeof audio === "object" &&
    audio.url &&
    audio.publicId &&
    String(audio.publicId).startsWith("kama-properties/hosts/")
  );
}

function propertyNeedsImageMigration(property) {
  const images = property.images || [];
  if (images.length === 0) return false;
  return images.some((entry) => !isMigratedImageEntry(entry));
}

await mongoose.connect(uri);

const db = mongoose.connection.db;
const propertiesCol = db.collection("Properties");
const usersCol = db.collection("users");
const logsCol = db.collection("CloudinaryMigrationLogs");

const properties = await propertiesCol.find({}).toArray();
let completed = 0;
let partial = 0;
let skipped = 0;
let failed = 0;
let legacyOwnerRemapped = 0;

/** @type {string | null} */
let fallbackHostId = process.env.CLOUDINARY_LEGACY_HOST_ID?.trim() || null;
if (fallbackHostId && !/^[a-fA-F0-9]{24}$/.test(fallbackHostId)) {
  console.error("CLOUDINARY_LEGACY_HOST_ID must be a 24-character hex ObjectId");
  process.exit(1);
}

async function resolveHostId(rawOwner) {
  const owner = String(rawOwner || "").trim();
  if (/^[a-fA-F0-9]{24}$/.test(owner)) return owner;

  if (!fallbackHostId) {
    const verified = await usersCol
      .find({ hostStatus: "verified" })
      .limit(1)
      .toArray();
    fallbackHostId = verified[0]?._id?.toString() || null;
  }
  return fallbackHostId;
}

for (const property of properties) {
  const propertyId = property._id.toString();
  const rawOwner = String(property.owner || "");
  const hostId = await resolveHostId(rawOwner);
  if (!hostId) {
    skipped += 1;
    console.log(`${propertyId}: skipped (no valid host for owner "${rawOwner}")`);
    continue;
  }
  const ownerWasLegacy = rawOwner !== hostId;
  if (ownerWasLegacy) legacyOwnerRemapped += 1;

  if (
    !propertyNeedsImageMigration(property) &&
    (!property.audio || isMigratedAudioEntry(property.audio))
  ) {
    skipped += 1;
    console.log(`${propertyId}: skipped (already on kama-properties/hosts/...)`);
    continue;
  }

  let logDoc = await logsCol.findOne({ propertyId: property._id });
  if (!logDoc) {
    logDoc = {
      propertyId: property._id,
      userId: hostId,
      status: "in_progress",
      startedAt: new Date(),
      migratedAssets: [],
      failedAssets: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
  logDoc.status = "in_progress";
  logDoc.migratedAssets = [];
  logDoc.failedAssets = [];
  logDoc.error = undefined;
  logDoc.updatedAt = new Date();

  const folder = propertyFolder(hostId, propertyId);
  const imagesFolder = propertyImagesFolder(hostId, propertyId);
  const nextImages = [];
  const migratedAssets = [];
  const failedAssets = [];

  for (const entry of property.images || []) {
    if (isMigratedImageEntry(entry)) {
      nextImages.push(entry);
      continue;
    }

    try {
      let uploaded;
      if (typeof entry === "string") {
        if (/^https?:\/\//i.test(entry)) {
          if (!dryRun) {
            uploaded = await uploadPropertyMediaFromUrl({
              sourceUrl: entry,
              hostId,
              propertyId,
              resourceType: "image",
              subfolder: "images",
            });
          } else {
            uploaded = { publicId: "(dry-run)", url: entry };
          }
        } else {
          const filePath = resolveLocalPropertyImagePath(entry, appRoot);
          if (!filePath) {
            failedAssets.push({
              type: "image",
              legacy: entry,
              error: "Local file not found",
            });
            nextImages.push(entry);
            continue;
          }
          if (!dryRun) {
            const buffer = readFileSync(filePath);
            uploaded = await uploadPropertyImage({
              buffer,
              filename: entry,
              hostId,
              propertyId,
            });
          } else {
            uploaded = { publicId: "(dry-run)", url: filePath };
          }
        }
      } else if (typeof entry === "object" && entry.url && /^https?:\/\//i.test(entry.url)) {
        if (!dryRun) {
          uploaded = await uploadPropertyMediaFromUrl({
            sourceUrl: entry.url,
            hostId,
            propertyId,
            resourceType: "image",
            subfolder: "images",
          });
        } else {
          uploaded = { publicId: "(dry-run)", url: entry.url };
        }
      } else {
        failedAssets.push({
          type: "image",
          legacy: JSON.stringify(entry),
          error: "Unsupported image entry",
        });
        continue;
      }

      if (uploaded) {
        nextImages.push(uploaded);
        migratedAssets.push({
          type: "image",
          legacy: typeof entry === "string" ? entry : "",
          publicId: uploaded.publicId,
          url: uploaded.url,
        });
      }
    } catch (err) {
      failedAssets.push({
        type: "image",
        legacy: typeof entry === "string" ? entry : "",
        error: err?.message || String(err),
      });
      nextImages.push(entry);
    }
  }

  let nextAudio = property.audio;
  if (property.audio && !isMigratedAudioEntry(property.audio)) {
    try {
      if (typeof property.audio === "object" && property.audio?.url) {
        if (!dryRun) {
          nextAudio = await uploadPropertyMediaFromUrl({
            sourceUrl: property.audio.url,
            hostId,
            propertyId,
            resourceType: "video",
            subfolder: "audio",
          });
          migratedAssets.push({
            type: "audio",
            legacy: property.audio.url,
            publicId: nextAudio.publicId,
            url: nextAudio.url,
          });
        }
      } else if (typeof property.audio === "string") {
        if (/^https?:\/\//i.test(property.audio)) {
          if (!dryRun) {
            nextAudio = await uploadPropertyMediaFromUrl({
              sourceUrl: property.audio,
              hostId,
              propertyId,
              resourceType: "video",
              subfolder: "audio",
            });
          }
        } else {
          const filePath = resolveLocalPropertyAudioPath(property.audio, appRoot);
          if (!filePath) {
            failedAssets.push({
              type: "audio",
              legacy: property.audio,
              error: "Local audio file not found",
            });
          } else if (!dryRun) {
            const buffer = readFileSync(filePath);
            nextAudio = await uploadPropertyAudio({
              buffer,
              filename: property.audio,
              hostId,
              propertyId,
            });
            migratedAssets.push({
              type: "audio",
              legacy: property.audio,
              publicId: nextAudio.publicId,
              url: nextAudio.url,
            });
          }
        }
      }
    } catch (err) {
      failedAssets.push({
        type: "audio",
        legacy:
          typeof property.audio === "string"
            ? property.audio
            : property.audio?.url,
        error: err?.message || String(err),
      });
    }
  }

  const hasFailures = failedAssets.length > 0;
  const hasMigrations = migratedAssets.length > 0;
  const status = hasFailures
    ? hasMigrations
      ? "partial"
      : "failed"
    : hasMigrations || isMigratedImageEntry(property.images?.[0])
      ? "completed"
      : "skipped";

  if (!dryRun && (hasMigrations || nextImages.length > 0)) {
    const propertyUpdate = {
      images: nextImages.length > 0 ? nextImages : property.images,
      audio: nextAudio,
      cloudinaryFolder: folder,
      cloudinaryImagesFolder: imagesFolder,
      cloudinaryMigrationStatus:
        status === "partial" ? "partial" : "completed",
    };
    if (ownerWasLegacy) {
      propertyUpdate.owner = hostId;
    }
    await propertiesCol.updateOne(
      { _id: property._id },
      { $set: propertyUpdate },
    );
    await usersCol.updateOne(
      { _id: new mongoose.Types.ObjectId(hostId) },
      { $set: { cloudinaryRootFolder: hostRootFolder(hostId) } },
    );
  }

  logDoc.status = status;
  logDoc.migratedAssets = migratedAssets;
  logDoc.failedAssets = failedAssets;
  logDoc.completedAt = new Date();
  logDoc.updatedAt = new Date();
  if (!dryRun) {
    if (logDoc._id) {
      await logsCol.updateOne({ _id: logDoc._id }, { $set: logDoc });
    } else {
      await logsCol.insertOne(logDoc);
    }
  }

  if (status === "completed") completed += 1;
  else if (status === "partial") partial += 1;
  else if (status === "failed") failed += 1;
  else skipped += 1;

  console.log(
    `${dryRun ? "[dry-run] " : ""}${propertyId}: ${status} (${migratedAssets.length} migrated, ${failedAssets.length} failed)`,
  );
}

console.log(
  `Backfill finished: ${completed} completed, ${partial} partial, ${failed} failed, ${skipped} skipped, ${legacyOwnerRemapped} legacy-owner listings remapped.`,
);
await mongoose.disconnect();
