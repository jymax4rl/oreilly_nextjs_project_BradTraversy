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
      OPS_DOCUMENTATION_RESTRICT_EMAIL:
        process.env.OPS_DOCUMENTATION_RESTRICT_EMAIL,
    };
    delete process.env.OPS_EMAIL_DOMAIN;
    delete process.env.ISEL_OPS_EMAIL_DOMAIN;
    delete process.env.OPS_DOCUMENTATION_EMAILS;
    delete process.env.OPS_DOCUMENTATION_RESTRICT_EMAIL;
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

  it("allows any ops staff by default (including personal Gmail)", () => {
    assert.equal(
      canAccessOpsDocumentation({
        role: "admin",
        email: "admin@gmail.com",
      }),
      true,
    );
    assert.equal(
      canAccessOpsDocumentation({
        role: "superadmin",
        email: "camara23.pro@gmail.com",
      }),
      true,
    );
  });

  it("still denies non-ops by default", () => {
    assert.equal(
      canAccessOpsDocumentation({
        role: "host",
        email: "host@isisel.com",
      }),
      false,
    );
  });

  it("when restrict mode is on, requires isisel domain", () => {
    process.env.OPS_DOCUMENTATION_RESTRICT_EMAIL = "1";
    assert.equal(
      canAccessOpsDocumentation({
        role: "admin",
        email: "ops@isisel.com",
      }),
      true,
    );
    assert.equal(
      canAccessOpsDocumentation({
        role: "admin",
        email: "admin@gmail.com",
      }),
      false,
    );
  });

  it("denies unauthenticated", () => {
    assert.equal(canAccessOpsDocumentation(null), false);
  });

  it("honors allowlist emails in restrict mode", () => {
    process.env.OPS_DOCUMENTATION_RESTRICT_EMAIL = "1";
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
