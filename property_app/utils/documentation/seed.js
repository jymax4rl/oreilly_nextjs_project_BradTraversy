import Documentation, {
  buildDocumentationSearchText,
} from "@/models/Documentation";
import { SEED_ARTICLES, SEED_VERSION } from "@/utils/documentation/seedArticles";

function isDuplicateKeyError(err) {
  return (
    err?.code === 11000 ||
    err?.code === "11000" ||
    /E11000 duplicate key/i.test(String(err?.message || ""))
  );
}

function buildSeedPayload(article) {
  const payload = {
    ...article,
    visibility: "ops",
    seedKey: SEED_VERSION,
    version: article.version || "1.1.0",
    author: {
      id: "system",
      email: "ops@isisel.com",
      name: "Isisel Docs Seed",
    },
    lastReviewedAt: new Date(),
  };
  payload.searchText = buildDocumentationSearchText(payload);
  return payload;
}

function isStillSeedOwned(existing) {
  return Boolean(
    existing?.seedKey &&
      existing.author?.id === "system" &&
      existing.status !== "archived",
  );
}

/**
 * Upsert seed articles. Never overwrites ops-edited articles that dropped seedKey
 * or that were edited after seed (detected via seedKey mismatch only for fresh seeds).
 *
 * Concurrent /documentation requests (layout + page) can race on first insert; we
 * single-flight within the process and treat duplicate-key as another winner.
 */
async function runDocumentationSeed() {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const article of SEED_ARTICLES) {
    const payload = buildSeedPayload(article);
    let existing = await Documentation.findOne({ slug: article.slug });

    if (!existing) {
      try {
        await Documentation.create(payload);
        created += 1;
        continue;
      } catch (err) {
        if (!isDuplicateKeyError(err)) throw err;
        // Another concurrent seed won the insert — re-read and fall through.
        existing = await Documentation.findOne({ slug: article.slug });
        if (!existing) {
          skipped += 1;
          continue;
        }
      }
    }

    // Preserve ops edits: if an article was manually changed (no seedKey or different
    // author that is not system), skip unless seedKey still matches previous seed.
    if (!isStillSeedOwned(existing)) {
      skipped += 1;
      continue;
    }

    Object.assign(existing, payload);
    await existing.save();
    updated += 1;
  }

  return {
    created,
    updated,
    skipped,
    total: SEED_ARTICLES.length,
    seedVersion: SEED_VERSION,
  };
}

let inflightSeed = null;
let completedSeedVersion = null;
let completedSeedResult = null;

export async function ensureDocumentationSeeded() {
  if (completedSeedVersion === SEED_VERSION && completedSeedResult) {
    return { ...completedSeedResult, cached: true };
  }

  if (!inflightSeed) {
    inflightSeed = runDocumentationSeed()
      .then((result) => {
        completedSeedVersion = SEED_VERSION;
        completedSeedResult = result;
        return result;
      })
      .finally(() => {
        inflightSeed = null;
      });
  }

  return inflightSeed;
}

/** Test helper — resets in-process seed memoization. */
export function __resetDocumentationSeedStateForTests() {
  inflightSeed = null;
  completedSeedVersion = null;
  completedSeedResult = null;
}
