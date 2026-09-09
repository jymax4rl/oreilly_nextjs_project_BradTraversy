import Documentation, {
  buildDocumentationSearchText,
} from "@/models/Documentation";
import { SEED_ARTICLES, SEED_VERSION } from "@/utils/documentation/seedArticles";

/**
 * Upsert seed articles. Never overwrites ops-edited articles that dropped seedKey
 * or that were edited after seed (detected via seedKey mismatch only for fresh seeds).
 * Strategy: upsert by slug when seedKey matches or doc does not exist / still seeded.
 */
export async function ensureDocumentationSeeded() {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const article of SEED_ARTICLES) {
    const existing = await Documentation.findOne({ slug: article.slug });
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

    if (!existing) {
      await Documentation.create(payload);
      created += 1;
      continue;
    }

    // Preserve ops edits: if an article was manually changed (no seedKey or different
    // author that is not system), skip unless seedKey still matches previous seed.
    const stillSeedOwned =
      existing.seedKey &&
      existing.author?.id === "system" &&
      existing.status !== "archived";

    if (!stillSeedOwned) {
      skipped += 1;
      continue;
    }

    Object.assign(existing, payload);
    await existing.save();
    updated += 1;
  }

  return { created, updated, skipped, total: SEED_ARTICLES.length, seedVersion: SEED_VERSION };
}
