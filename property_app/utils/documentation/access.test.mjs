import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import {
  canAccessOpsDocumentation,
  isAuthorizedOpsDocumentationEmail,
  getOpsEmailDomain,
} from "./access.js";

describe("ops documentation access", () => {
  let snapshot;

  beforeEach(() => {
    snapshot = {
      OPS_EMAIL_DOMAIN: process.env.OPS_EMAIL_DOMAIN,
      ISEL_OPS_EMAIL_DOMAIN: process.env.ISEL_OPS_EMAIL_DOMAIN,
      OPS_DOCUMENTATION_EMAILS: process.env.OPS_DOCUMENTATION_EMAILS,
    };
    delete process.env.OPS_EMAIL_DOMAIN;
    delete process.env.ISEL_OPS_EMAIL_DOMAIN;
    delete process.env.OPS_DOCUMENTATION_EMAILS;
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(snapshot)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("defaults domain to isisel.com", () => {
    assert.equal(getOpsEmailDomain(), "isisel.com");
  });

  it("allows ops staff on isisel domain", () => {
    assert.equal(
      canAccessOpsDocumentation({
        role: "admin",
        email: "ops@isisel.com",
      }),
      true,
    );
    assert.equal(
      canAccessOpsDocumentation({
        role: "superadmin",
        email: "lead@isisel.com",
      }),
      true,
    );
  });

  it("denies ops staff on external email", () => {
    assert.equal(
      canAccessOpsDocumentation({
        role: "admin",
        email: "admin@gmail.com",
      }),
      false,
    );
  });

  it("denies non-ops even on isisel domain", () => {
    assert.equal(
      canAccessOpsDocumentation({
        role: "host",
        email: "host@isisel.com",
      }),
      false,
    );
    assert.equal(
      canAccessOpsDocumentation({
        role: "guest",
        email: "guest@isisel.com",
      }),
      false,
    );
  });

  it("denies unauthenticated", () => {
    assert.equal(canAccessOpsDocumentation(null), false);
  });

  it("honors allowlist emails", () => {
    process.env.OPS_DOCUMENTATION_EMAILS = "contractor@example.com";
    assert.equal(
      isAuthorizedOpsDocumentationEmail("contractor@example.com"),
      true,
    );
    assert.equal(
      canAccessOpsDocumentation({
        role: "admin",
        email: "contractor@example.com",
      }),
      true,
    );
  });
});
