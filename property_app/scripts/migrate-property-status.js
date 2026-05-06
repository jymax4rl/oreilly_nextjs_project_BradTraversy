/**
 * Migration: stamp existing properties that have no `status` field as "approved".
 *
 * Properties already in the database before the status field was introduced
 * were publicly visible, so they should be considered approved.
 *
 * Usage:
 *   MONGODB_URI=<your-uri> node scripts/migrate-property-status.js
 */

const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI environment variable is not set.");
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  const result = await mongoose.connection
    .collection("Properties")
    .updateMany(
      { status: { $exists: false } },
      { $set: { status: "approved" } }
    );

  console.log(`Migration complete. Updated ${result.modifiedCount} properties.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
