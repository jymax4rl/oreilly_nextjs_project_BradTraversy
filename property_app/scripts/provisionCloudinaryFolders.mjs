/**
 * Creates Cloudinary folder tree: kama-properties/hosts/{hostId}/properties/{propertyId}/[images|audio]
 * Usage: npm run db:provision-cloudinary-folders
 *        npm run db:provision-cloudinary-folders -- --dry-run
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

loadEnvFile(".env");
loadEnvFile(".env.local");

const { default: cloudinary, isCloudinaryConfigured } = await import(
  "../utils/cloudinary/cloudinary.js"
);
const { CLOUDINARY_ROOT, propertyFolder, hostRootFolder } = await import(
  "../utils/cloudinary/generateFolderPath.js"
);

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI required in property_app/.env");
  process.exit(1);
}
if (!isCloudinaryConfigured()) {
  console.error("Cloudinary credentials required (CLOUDINARY_URL or CLOUDINARY_* vars)");
  process.exit(1);
}

async function ensureFolder(path) {
  if (dryRun) {
    console.log(`[dry-run] would create folder: ${path}`);
    return { path, dryRun: true };
  }
  try {
    const result = await cloudinary.api.create_folder(path);
    console.log(`Created: ${path}`);
    return result;
  } catch (err) {
    const msg = err?.message || String(err);
    if (/already exists/i.test(msg)) {
      console.log(`Exists: ${path}`);
      return { path, exists: true };
    }
    throw err;
  }
}

await mongoose.connect(process.env.MONGODB_URI);
const properties = await mongoose.connection.db
  .collection("Properties")
  .find({}, { projection: { owner: 1 } })
  .toArray();

const byHost = new Map();
for (const p of properties) {
  const hostId = String(p.owner || "");
  if (!/^[a-fA-F0-9]{24}$/.test(hostId)) continue;
  if (!byHost.has(hostId)) byHost.set(hostId, []);
  byHost.get(hostId).push(p._id.toString());
}

const folderPaths = new Set([CLOUDINARY_ROOT, `${CLOUDINARY_ROOT}/hosts`]);
for (const [hostId, propertyIds] of byHost) {
  folderPaths.add(hostRootFolder(hostId));
  for (const propertyId of propertyIds) {
    folderPaths.add(propertyFolder(hostId, propertyId));
    folderPaths.add(propertyFolder(hostId, propertyId, "images"));
    folderPaths.add(propertyFolder(hostId, propertyId, "audio"));
  }
}

const sorted = [...folderPaths].sort(
  (a, b) => a.split("/").length - b.split("/").length,
);

console.log(
  `Provisioning ${sorted.length} folders for ${byHost.size} hosts (${properties.length} properties)…`,
);

for (const path of sorted) {
  await ensureFolder(path);
}

console.log("Done.");
await mongoose.disconnect();
