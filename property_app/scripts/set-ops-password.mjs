/**
 * Set or rotate the ops Credentials password for an existing admin/superadmin.
 *
 * Usage (from property_app/):
 *   OPS_PASSWORD="your-strong-password" node scripts/set-ops-password.mjs
 *   OPS_PASSWORD="..." OPS_EMAIL="camara23.pro@gmail.com" node scripts/set-ops-password.mjs
 *   OPS_PASSWORD="..." node scripts/set-ops-password.mjs camara23.pro@gmail.com
 *
 * Optional:
 *   OPS_PROMOTE=1  — if the user exists but is not admin/superadmin, set role to admin
 *   OPS_ROLE=superadmin — with OPS_PROMOTE, set that role instead
 *
 * Loads MONGODB_URI from property_app/.env or .env.local. Never commit passwords.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = join(__dirname, "..");

function loadDotEnvFile(fileName) {
  const envPath = join(appRoot, fileName);
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
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

loadDotEnvFile(".env.local");
loadDotEnvFile(".env");

const OPS_ROLES = new Set(["admin", "superadmin"]);
const emailArg = process.argv[2];
const email = String(
  emailArg || process.env.OPS_EMAIL || "camara23.pro@gmail.com",
)
  .trim()
  .toLowerCase();
const password = String(process.env.OPS_PASSWORD || "");
const promote = process.env.OPS_PROMOTE === "1";
const promoteRole =
  process.env.OPS_ROLE === "superadmin" ? "superadmin" : "admin";

if (!password || password.length < 10) {
  console.error(
    "Set OPS_PASSWORD to a strong password (min 10 characters). Do not commit it.",
  );
  process.exit(1);
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Missing MONGODB_URI in .env / .env.local.");
  process.exit(1);
}

const UserSchema = new mongoose.Schema(
  {
    email: String,
    username: String,
    role: String,
    passwordHash: String,
  },
  { collection: "users", strict: false },
);

async function main() {
  await mongoose.connect(uri, { dbName: "KamaProperties" });
  const User = mongoose.models.User || mongoose.model("User", UserSchema);

  const user = await User.findOne({
    email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
  });

  if (!user) {
    console.error(`No user found for ${email}. Sign in once with Google first, or create the account.`);
    process.exit(1);
  }

  if (!OPS_ROLES.has(user.role)) {
    if (!promote) {
      console.error(
        `User ${email} has role "${user.role}". Promote to admin in MongoDB, or re-run with OPS_PROMOTE=1.`,
      );
      process.exit(1);
    }
    user.role = promoteRole;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  user.passwordHash = passwordHash;
  // Normalize stored email for Credentials lookups
  user.email = email;
  await user.save();

  console.log(
    `Ops password set for ${email} (role=${user.role}). Sign in at /ops/login`,
  );
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
