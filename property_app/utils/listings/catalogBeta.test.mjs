import assert from "node:assert/strict";
import { describe, it, afterEach } from "node:test";

const ENV_KEY = "NEXT_PUBLIC_LISTINGS_CATALOG_BETA";

async function loadCatalogBeta() {
  // Fresh module each time so env changes apply (ESM cache).
  const url = new URL("./catalogBeta.js", import.meta.url);
  url.searchParams.set("t", String(Date.now()) + Math.random());
  return import(url.href);
}

describe("catalogBeta defaults", () => {
  const previous = process.env[ENV_KEY];

  afterEach(() => {
    if (previous === undefined) delete process.env[ENV_KEY];
    else process.env[ENV_KEY] = previous;
  });

  it("defaults OPEN when env unset (guest marketplace must not be blank)", async () => {
    delete process.env[ENV_KEY];
    const { isListingsCatalogBeta, canBrowseListingCatalog } =
      await loadCatalogBeta();
    assert.equal(isListingsCatalogBeta(), false);
    assert.equal(canBrowseListingCatalog(null), true);
    assert.equal(canBrowseListingCatalog({ user: null }), true);
  });

  it("closes catalogue only when explicitly true/1", async () => {
    process.env[ENV_KEY] = "true";
    let mod = await loadCatalogBeta();
    assert.equal(mod.isListingsCatalogBeta(), true);
    assert.equal(mod.canBrowseListingCatalog(null), false);

    process.env[ENV_KEY] = "1";
    mod = await loadCatalogBeta();
    assert.equal(mod.isListingsCatalogBeta(), true);

    process.env[ENV_KEY] = "false";
    mod = await loadCatalogBeta();
    assert.equal(mod.isListingsCatalogBeta(), false);
    assert.equal(mod.canBrowseListingCatalog(null), true);
  });
});
