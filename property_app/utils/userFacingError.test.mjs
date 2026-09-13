import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isRetryableClientError,
  toUserFacingError,
} from "./userFacingError.js";

describe("toUserFacingError", () => {
  it("hides FetchEvent / offline service-worker plumbing", () => {
    assert.equal(
      toUserFacingError(
        "FetchEvent.respondWith received an error: Error: offline",
        "Unable to load stay",
      ),
      "Unable to load stay",
    );
  });

  it("hides Failed to fetch", () => {
    assert.equal(
      toUserFacingError(new TypeError("Failed to fetch"), "Try again"),
      "Try again",
    );
  });

  it("keeps intentional guest copy", () => {
    assert.equal(
      toUserFacingError(
        "You appear to be offline. Check your connection and try again.",
      ),
      "You appear to be offline. Check your connection and try again.",
    );
  });

  it("keeps short product errors", () => {
    assert.equal(toUserFacingError("Invalid promo code"), "Invalid promo code");
  });
});

describe("isRetryableClientError", () => {
  it("detects SW offline failures", () => {
    assert.equal(
      isRetryableClientError(
        "FetchEvent.respondWith received an error: Error: offline",
      ),
      true,
    );
  });
});
