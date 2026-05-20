import { existsSync } from "fs";
import { join } from "path";

/**
 * Resolve on-disk path for a legacy property image filename.
 * Course assets live under public/properties/; uploads may use public/images/properties/.
 * @param {string} filename
 * @param {string} appRoot process.cwd() in API routes, or property_app root in scripts
 */
export function resolveLocalPropertyImagePath(filename, appRoot = process.cwd()) {
  const base = String(filename || "")
    .replace(/^.*[/\\]/, "")
    .trim();
  if (!base) return null;

  const candidates = [
    join(appRoot, "public", "properties", base),
    join(appRoot, "public", "images", "properties", base),
  ];

  return candidates.find((p) => existsSync(p)) ?? null;
}

/**
 * @param {string} filename
 * @param {string} [appRoot]
 */
export function resolveLocalPropertyAudioPath(filename, appRoot = process.cwd()) {
  const base = String(filename || "")
    .replace(/^.*[/\\]/, "")
    .trim();
  if (!base) return null;

  const candidates = [
    join(appRoot, "public", "audio", "properties", base),
    join(appRoot, "public", "properties", base),
  ];

  return candidates.find((p) => existsSync(p)) ?? null;
}
