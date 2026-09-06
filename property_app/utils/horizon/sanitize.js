function stripText(value, max) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Public Horizon ownership interest form.
 */
export function parseHorizonLeadInput(body) {
  const honeypot = Boolean(String(body?.fax || body?.website || "").trim());
  const name = stripText(body?.name, 120);
  const email = stripText(body?.email, 180).toLowerCase();
  const phone = stripText(body?.phone, 40);
  const intentRaw = stripText(body?.intent, 20).toLowerCase();
  const intent = intentRaw === "message" ? "message" : "call";
  const message = stripText(body?.message || body?.note, 4000);

  const errors = [];
  if (!name || name.length < 2) errors.push("name");
  if (!email || !isEmail(email)) errors.push("email");
  if (intent === "call" && (!phone || phone.length < 6)) errors.push("phone");
  if (intent === "message" && (!message || message.length < 8)) {
    errors.push("message");
  }

  return {
    honeypot,
    errors,
    name,
    email,
    phone,
    intent,
    message,
  };
}
