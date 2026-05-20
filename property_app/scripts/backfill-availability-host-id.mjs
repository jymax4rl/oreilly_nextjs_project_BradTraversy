/**
 * Sets hostId on every PropertyAvailability from Property.owner.
 * Usage: node scripts/backfill-availability-host-id.mjs
 */
import dns from "node:dns";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

// Some local DNS setups reject Node's SRV lookups for mongodb+srv (ECONNREFUSED).
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = join(__dirname, "..");

function loadDotEnv() {
  const envPath = join(appRoot, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
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
    if (!process.env[key]) process.env[key] = value;
  }
}

loadDotEnv();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI required in property_app/.env");
  process.exit(1);
}

await mongoose.connect(uri);

const db = mongoose.connection.db;
const avail = db.collection("PropertyAvailabilities");
const properties = db.collection("Properties");

const cursor = avail.find({});
let updated = 0;
let skipped = 0;

for await (const doc of cursor) {
  const property = await properties.findOne(
    { _id: doc.propertyId },
    { projection: { owner: 1 } },
  );
  const hostId = property?.owner;
  if (!hostId) {
    skipped += 1;
    continue;
  }
  if (doc.hostId === hostId) {
    skipped += 1;
    continue;
  }
  await avail.updateOne({ _id: doc._id }, { $set: { hostId } });
  updated += 1;
}

console.log(`Backfill complete: ${updated} updated, ${skipped} unchanged or missing property.`);
await mongoose.disconnect();
