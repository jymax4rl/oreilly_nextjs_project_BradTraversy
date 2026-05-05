/**
 * Deep-convert Mongoose lean docs (ObjectId, Date, nested BSON) into values that
 * Next.js can pass from Server Components to Client Components (plain JSON).
 */

import mongoose from "mongoose";

function isMongoObjectId(value) {
  if (!value || typeof value !== "object") return false;
  if (value._bsontype === "ObjectId") return true;
  if (typeof value.toHexString === "function") return true;
  return value.constructor?.name === "ObjectId";
}

/** Spread `{ ...doc }` turns ObjectId into `{ buffer: <Buffer> }` — recover id string */
function objectIdBufferPlainObject(value) {
  if (!value || typeof value !== "object") return null;
  const b = value.buffer;
  if (!b) return null;
  const buf = Buffer.isBuffer(b)
    ? b
    : b instanceof Uint8Array
      ? Buffer.from(b)
      : null;
  if (!buf || buf.length !== 12) return null;
  try {
    return new mongoose.Types.ObjectId(buf).toString();
  } catch {
    return null;
  }
}

function walk(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === "bigint") return Number(value);
  if (value instanceof Date) return value.toISOString();

  if (Array.isArray(value)) {
    return value.map(walk);
  }

  if (typeof value === "object") {
    if (isMongoObjectId(value)) {
      return String(value);
    }

    const fromBufferPlain = objectIdBufferPlainObject(value);
    if (fromBufferPlain) return fromBufferPlain;

    if (Buffer.isBuffer(value)) {
      return undefined;
    }

    // Nested Mongoose subdocs may use non-Object constructors — always recurse keys
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      const next = walk(v);
      if (next !== undefined || v === null) {
        out[k] = next;
      }
    }
    return out;
  }

  return value;
}

/** Single property document */
export function serializePropertyForClient(doc) {
  if (doc == null) return doc;
  return walk(doc);
}

/** Array of property documents */
export function serializePropertiesForClient(docs) {
  if (!Array.isArray(docs)) return [];
  return docs.map((d) => serializePropertyForClient(d));
}
