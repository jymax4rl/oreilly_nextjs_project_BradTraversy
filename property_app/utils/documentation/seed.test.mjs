import assert from "node:assert/strict";
import test from "node:test";

/**
 * Unit coverage for duplicate-key handling without a live Mongo connection.
 * Mirrors the race path that hit production: findOne → create → E11000.
 */

function isDuplicateKeyError(err) {
  return (
    err?.code === 11000 ||
    err?.code === "11000" ||
    /E11000 duplicate key/i.test(String(err?.message || ""))
  );
}

async function seedArticleOnce({ findOne, create, saveExisting }) {
  let existing = await findOne();
  if (!existing) {
    try {
      await create();
      return "created";
    } catch (err) {
      if (!isDuplicateKeyError(err)) throw err;
      existing = await findOne();
      if (!existing) return "skipped";
    }
  }
  if (!existing.seedKey || existing.author?.id !== "system") {
    return "skipped";
  }
  await saveExisting(existing);
  return "updated";
}

test("isDuplicateKeyError detects Mongo E11000 shapes", () => {
  assert.equal(isDuplicateKeyError({ code: 11000 }), true);
  assert.equal(
    isDuplicateKeyError({
      message:
        'E11000 duplicate key error collection: KamaProperties.documentations index: slug_1 dup key: { slug: "platform-overview" }',
    }),
    true,
  );
  assert.equal(isDuplicateKeyError({ code: 1 }), false);
});

test("concurrent create race resolves as update/skip instead of throw", async () => {
  let finds = 0;
  const doc = {
    slug: "platform-overview",
    seedKey: "v1",
    author: { id: "system" },
  };

  const result = await seedArticleOnce({
    findOne: async () => {
      finds += 1;
      // First look: missing. After failed create: present.
      return finds === 1 ? null : doc;
    },
    create: async () => {
      const err = new Error("E11000 duplicate key error");
      err.code = 11000;
      throw err;
    },
    saveExisting: async () => {},
  });

  assert.equal(result, "updated");
  assert.equal(finds, 2);
});

test("duplicate key with missing re-read is skipped, not thrown", async () => {
  const result = await seedArticleOnce({
    findOne: async () => null,
    create: async () => {
      const err = new Error("E11000 duplicate key error");
      err.code = 11000;
      throw err;
    },
    saveExisting: async () => {
      throw new Error("should not save");
    },
  });
  assert.equal(result, "skipped");
});
