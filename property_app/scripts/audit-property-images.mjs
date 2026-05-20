import dns from "node:dns";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

dns.setServers(["8.8.8.8", "1.1.1.1"]);
const appRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(filename) {
  const envPath = join(appRoot, filename);
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/)) {
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

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI missing");
  process.exit(1);
}

const { isCloudinaryConfigured } = await import("../utils/cloudinary/cloudinary.js");
await mongoose.connect(uri);

const props = await mongoose.connection.db.collection("Properties").find({}).toArray();
let cloudinary = 0;
let legacyString = 0;
let other = 0;
let badOwner = 0;
const legacySamples = [];

for (const p of props) {
  const hostId = String(p.owner || "");
  if (!/^[a-fA-F0-9]{24}$/.test(hostId)) badOwner += 1;

  const images = p.images || [];
  if (images.length === 0) continue;

  const first = images[0];
  if (typeof first === "object" && first?.publicId?.startsWith("kama-properties/hosts/")) {
    cloudinary += 1;
  } else if (typeof first === "string" && !/^https?:\/\//i.test(first)) {
    legacyString += 1;
    if (legacySamples.length < 8) {
      legacySamples.push({
        id: p._id.toString(),
        name: p.name,
        owner: hostId,
        images: images.slice(0, 3),
      });
    }
  } else {
    other += 1;
  }
}

console.log(JSON.stringify({
  total: props.length,
  cloudinaryMigrated: cloudinary,
  legacyFilenames: legacyString,
  other,
  invalidOwner: badOwner,
  cloudinaryConfigured: isCloudinaryConfigured(),
  samples: legacySamples,
}, null, 2));

await mongoose.disconnect();
