/**
 * Creates and publishes Resend templates for guest + host booking emails.
 * Requires RESEND_ADMIN_API_KEY (Full access) or RESEND_API_KEY, and EMAIL_FROM.
 * Production sends use RESEND_BOOKING_API_KEY (Sending access only).
 *
 * Usage: npm run setup:email-templates
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = join(__dirname, "..");

function loadDotEnv() {
  const envPath = join(appRoot, ".env");
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadDotEnv();

const { Resend } = await import("resend");
const { guestTemplateMeta, hostTemplateMeta } = await import(
  "../utils/email/bookingEmailTemplateHtml.js"
);

const apiKey =
  process.env.RESEND_ADMIN_API_KEY || process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error(
    "Missing RESEND_ADMIN_API_KEY (Full access). Add it to property_app/.env for template setup only.",
  );
  process.exit(1);
}

const resend = new Resend(apiKey);

async function upsertTemplate(meta) {
  const existing = await resend.templates.get(meta.alias);
  if (existing.data?.id) {
    console.log(`Updating template "${meta.alias}" (${existing.data.id})…`);
    const updated = await resend.templates.update(meta.alias, {
      name: meta.name,
      subject: meta.subject,
      html: meta.html,
      variables: meta.variables,
    });
    if (updated.error) throw new Error(JSON.stringify(updated.error));
    const published = await resend.templates.publish(meta.alias);
    if (published.error) throw new Error(JSON.stringify(published.error));
    return { id: existing.data.id, alias: meta.alias, action: "updated" };
  }

  console.log(`Creating template "${meta.alias}"…`);
  const created = await resend.templates.create({
    name: meta.name,
    alias: meta.alias,
    subject: meta.subject,
    html: meta.html,
    variables: meta.variables,
    from: process.env.EMAIL_FROM || undefined,
  });

  const publishResult = await created.publish();
  if (publishResult.error) throw new Error(JSON.stringify(publishResult.error));
  const id = publishResult.data?.id || created?.data?.id;
  return { id, alias: meta.alias, action: "created" };
}

async function main() {
  const guest = await upsertTemplate(guestTemplateMeta());
  const host = await upsertTemplate(hostTemplateMeta());

  console.log("\nResend booking templates ready:\n");
  console.log(`  Guest: ${guest.alias} (${guest.id}) [${guest.action}]`);
  console.log(`  Host:  ${host.alias} (${host.id}) [${host.action}]`);
  console.log("\nAdd to Vercel (property_app) after deploy:");
  console.log("  RESEND_TEMPLATES_READY=true");
  console.log(`  RESEND_TEMPLATE_GUEST_ID=${guest.alias}`);
  console.log(`  RESEND_TEMPLATE_HOST_ID=${host.alias}`);
  console.log("\nUntil then, booking emails use the same HTML inline (no template API).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
