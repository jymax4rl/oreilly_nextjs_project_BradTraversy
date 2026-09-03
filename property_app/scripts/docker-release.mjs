#!/usr/bin/env node
/**
 * Build & tag the production image from VERSION (SemVer).
 *
 * Tags applied for version 1.1.0:
 *   kama-properties:1.1.0   (exact)
 *   kama-properties:1.1     (minor line — “version 1.1”)
 *   kama-properties:latest  (moving tip of this repo’s Docker line)
 *
 * Usage (from property_app/):
 *   node scripts/docker-release.mjs              # build + tag from VERSION
 *   node scripts/docker-release.mjs --bump 1.2.0 # write VERSION + package.json, then build
 *   node scripts/docker-release.mjs --no-build   # only sync tags / print plan
 *   node scripts/docker-release.mjs --push REG   # also docker push REG/kama-properties:…
 *   node scripts/docker-release.mjs --tag mvp    # also tag kama-properties:mvp
 *
 * Extra docker build args: pass after --
 *   node scripts/docker-release.mjs -- --build-arg NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=x
 *
 * Google Maps: NEXT_PUBLIC_* is inlined at `next build`. This script loads
 * GOOGLE_MAPS_API_KEY / NEXT_PUBLIC_GOOGLE_MAPS_API_KEY from .env.local (or
 * process.env) as build-args — never prints key values.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const versionPath = join(root, "VERSION");
const packagePath = join(root, "package.json");
const envLocalPath = join(root, ".env.local");
const imageName = process.env.DOCKER_IMAGE_NAME || "kama-properties";

const SEMVER = /^\d+\.\d+\.\d+$/;

/** Keys read from .env.local / process.env for docker --build-arg (public + Maps). */
const BUILD_ENV_KEYS = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_DOMAIN",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
  "NEXT_PUBLIC_CURRENCY_EXCHANGE_RATE_API",
  "NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY",
  "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
  "GOOGLE_MAPS_API_KEY",
  "NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID",
  "GOOGLE_MAPS_MAP_ID",
];

const SECRET_BUILD_KEYS = new Set([
  "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
  "GOOGLE_MAPS_API_KEY",
]);

function parseArgs(argv) {
  const out = {
    bump: null,
    push: null,
    noBuild: false,
    extraTags: [],
    dockerArgs: [],
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") {
      out.dockerArgs = argv.slice(i + 1);
      break;
    }
    if (a === "--no-build") out.noBuild = true;
    else if (a === "--bump") out.bump = argv[++i];
    else if (a === "--push") out.push = argv[++i];
    else if (a === "--tag") out.extraTags.push(argv[++i]);
    else if (a === "--help" || a === "-h") out.help = true;
    else throw new Error(`Unknown arg: ${a}`);
  }
  return out;
}

/**
 * Parse KEY=VALUE lines from a dotenv-style file (no expansion).
 * Does not log values.
 */
function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const out = {};
  const text = readFileSync(filePath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

/**
 * Resolve build-arg values: process.env wins, then .env.local.
 * Returns { args: string[] of --build-arg KEY=VAL, present: string[] keys set }.
 */
function resolvePublicBuildArgs() {
  const fromFile = parseEnvFile(envLocalPath);
  const args = [];
  const present = [];
  for (const key of BUILD_ENV_KEYS) {
    const val = (process.env[key] || fromFile[key] || "").trim();
    if (!val) continue;
    args.push("--build-arg", `${key}=${val}`);
    present.push(key);
  }
  return { args, present };
}

function readVersion() {
  if (!existsSync(versionPath)) {
    throw new Error(`Missing ${versionPath}`);
  }
  return readFileSync(versionPath, "utf8").trim();
}

function writeVersion(v) {
  if (!SEMVER.test(v)) {
    throw new Error(`Version must be SemVer X.Y.Z (got "${v}")`);
  }
  writeFileSync(versionPath, `${v}\n`, "utf8");
  const pkg = JSON.parse(readFileSync(packagePath, "utf8"));
  pkg.version = v;
  writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
  console.log(`Updated VERSION and package.json → ${v}`);
}

function minorLine(v) {
  const [maj, min] = v.split(".");
  return `${maj}.${min}`;
}

function run(cmd, args, opts = {}) {
  console.log(`\n> ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, {
    stdio: "inherit",
    cwd: root,
    env: process.env,
    // Avoid shell concatenation (DEP0190); Docker Desktop ships `docker` on PATH.
    shell: false,
    ...opts,
  });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(
      `Usage: node scripts/docker-release.mjs [--bump X.Y.Z] [--tag NAME] [--no-build] [--push REGISTRY] [-- docker-build-args...]`,
    );
    process.exit(0);
  }

  if (args.bump) writeVersion(args.bump);

  const version = readVersion();
  if (!SEMVER.test(version)) {
    throw new Error(`VERSION must be SemVer X.Y.Z (got "${version}")`);
  }

  const line = minorLine(version);
  const tags = [
    `${imageName}:${version}`,
    `${imageName}:${line}`,
    `${imageName}:latest`,
  ];
  for (const extra of args.extraTags) {
    if (extra) tags.push(`${imageName}:${extra}`);
  }

  const { args: envBuildArgs, present: envPresent } = resolvePublicBuildArgs();
  const mapsKeyPresent = envPresent.some((k) => SECRET_BUILD_KEYS.has(k));

  console.log(`\nDocker release plan`);
  console.log(`  version (exact):  ${version}`);
  console.log(`  version (line):   ${line}   ← “version ${line}”`);
  console.log(`  tags:             ${tags.join(", ")}`);
  console.log(
    `  build-args from env/.env.local: ${envPresent.length ? envPresent.join(", ") : "(none)"}`,
  );
  console.log(
    `  Google Maps API key for client bundle: ${mapsKeyPresent ? "present (value not shown)" : "MISSING — address search will soft-fail in browser"}`,
  );

  if (args.noBuild) {
    process.exit(0);
  }

  // Log the docker command without secret values (replace Maps key build-args).
  const buildArgs = [
    "build",
    "-t",
    tags[0],
    "--build-arg",
    `APP_VERSION=${version}`,
    ...(args.extraTags.includes("mvp")
      ? ["--build-arg", "APP_CHANNEL=mvp"]
      : []),
    ...envBuildArgs,
    ...args.dockerArgs,
    ".",
  ];
  const redactedForLog = [];
  for (let i = 0; i < buildArgs.length; i++) {
    if (
      buildArgs[i] === "--build-arg" &&
      buildArgs[i + 1] &&
      SECRET_BUILD_KEYS.has(buildArgs[i + 1].split("=")[0])
    ) {
      redactedForLog.push("--build-arg", `${buildArgs[i + 1].split("=")[0]}=***`);
      i++;
      continue;
    }
    redactedForLog.push(buildArgs[i]);
  }
  console.log(`\n> docker ${redactedForLog.join(" ")}`);
  const r = spawnSync("docker", buildArgs, {
    stdio: "inherit",
    cwd: root,
    env: process.env,
    shell: false,
  });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }

  // Retag minor line + latest (+ optional --tag) from the exact version tag
  for (const t of tags.slice(1)) {
    run("docker", ["tag", tags[0], t]);
  }

  if (args.push) {
    const registry = args.push.replace(/\/$/, "");
    for (const t of tags) {
      const remote = `${registry}/${t}`;
      run("docker", ["tag", t, remote]);
      run("docker", ["push", remote]);
    }
  }

  console.log(`\nDone. Run with:\n  docker run --rm -p 3000:3000 --env-file .env.local ${tags[0]}`);
  console.log(`  or: docker compose up`);
  if (!mapsKeyPresent) {
    console.log(
      `\nNote: rebuild with GOOGLE_MAPS_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local for address autocomplete.`,
    );
  }
}

try {
  main();
} catch (err) {
  console.error(err.message || err);
  process.exit(1);
}
