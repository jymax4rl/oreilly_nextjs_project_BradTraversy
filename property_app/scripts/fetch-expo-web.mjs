/**
 * Downloads the isisel-mobile Expo web export into public/ before `next build`.
 * Bundle is a gzip tarball hosted on Cloudinary with a .js public_id (ZIP/TGZ
 * delivery is blocked as "Untrusted File Access" on this cloud).
 *
 * Override with EXPO_WEB_DIST_URL.
 */
import { createWriteStream, existsSync, mkdirSync, rmSync } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const publicDir = path.join(root, "public");
const archivePath = path.join(root, ".expo-web-dist.tgz");
const extractDir = path.join(root, ".expo-web-dist");

const DEFAULT_URL =
  "https://res.cloudinary.com/dyrjziqft/raw/upload/v1789392084/isisel/expo-web/dist-bundle.js";

const url = process.env.EXPO_WEB_DIST_URL || DEFAULT_URL;

function wipe(p) {
  if (existsSync(p)) rmSync(p, { recursive: true, force: true });
}

async function download(dest) {
  console.log(`[fetch-expo-web] GET ${url}`);
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok || !res.body) {
    throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  }
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
}

function copyTree(from, to) {
  mkdirSync(path.dirname(to), { recursive: true });
  execFileSync("cp", ["-a", from, to]);
}

async function main() {
  wipe(archivePath);
  wipe(extractDir);
  await download(archivePath);
  mkdirSync(extractDir, { recursive: true });
  execFileSync("tar", ["-xzf", archivePath, "-C", extractDir]);

  wipe(path.join(publicDir, "_expo"));
  wipe(path.join(publicDir, "assets"));
  wipe(path.join(publicDir, "app-web"));
  mkdirSync(path.join(publicDir, "app-web"), { recursive: true });

  copyTree(path.join(extractDir, "_expo"), path.join(publicDir, "_expo"));
  copyTree(path.join(extractDir, "assets"), path.join(publicDir, "assets"));

  for (const name of [
    "index.html",
    "browse.html",
    "messages.html",
    "more.html",
    "saved.html",
    "trips.html",
    "+not-found.html",
    "_sitemap.html",
    "favicon.ico",
  ]) {
    const src = path.join(extractDir, name);
    if (existsSync(src)) {
      copyTree(src, path.join(publicDir, "app-web", name));
    }
  }
  for (const dir of ["auth", "property", "inbox", "(tabs)"]) {
    const src = path.join(extractDir, dir);
    if (existsSync(src)) {
      copyTree(src, path.join(publicDir, "app-web", dir));
    }
  }

  const favicon = path.join(extractDir, "favicon.ico");
  if (existsSync(favicon)) {
    copyTree(favicon, path.join(publicDir, "favicon.ico"));
  }

  wipe(archivePath);
  wipe(extractDir);
  console.log(
    "[fetch-expo-web] staged into public/_expo, public/assets, public/app-web",
  );
}

main().catch((err) => {
  console.error("[fetch-expo-web]", err);
  process.exit(1);
});
