import { CONTACT_SOURCE, CONTACT_TOPIC_IDS } from "./constants";
import {
  isValidEmail,
  normalizeEmail,
  stripHeaderSafe,
  stripText,
} from "@/utils/creators/sanitize";

export function parseContactInput(body) {
  const name = stripHeaderSafe(body?.name, 120);
  const email = normalizeEmail(body?.email);
  const topicRaw = String(body?.topic || "").trim().toLowerCase();
  const topic = CONTACT_TOPIC_IDS.includes(topicRaw) ? topicRaw : "";
  const message = stripText(body?.message, 4000);
  const honeypot = String(body?.company || body?.website || body?.fax || "").trim();

  const errors = [];
  if (!name || name.length < 2) errors.push("name");
  if (!isValidEmail(email)) errors.push("email");
  if (!topic) errors.push("topic");
  if (!message || message.length < 12) errors.push("message");

  return {
    name,
    email,
    topic,
    message,
    source: CONTACT_SOURCE,
    honeypot: Boolean(honeypot),
    errors,
  };
}
