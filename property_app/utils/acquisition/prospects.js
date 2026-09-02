import {
  STAGE_IDS,
  SOURCE_IDS,
  PRIORITY_IDS,
  CONTACT_METHOD_IDS,
  CONTACT_STATUS_IDS,
  EMAIL_RE,
} from "@/utils/acquisition/constants";

export function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function actorPayload(value) {
  if (!value || typeof value !== "object") return undefined;
  const id = value.id || value._id ? String(value.id || value._id) : null;
  const email = String(value.email || "").trim().toLowerCase() || null;
  const name = String(value.name || value.username || "").trim() || null;
  if (!id && !email) return undefined;
  return { id, email, name };
}

function clampString(value, max) {
  return String(value || "").trim().slice(0, max);
}

function asInt(value, fallback, min, max) {
  if (value === "" || value == null) return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function asStringArray(value, maxItems = 12, maxLen = 60) {
  const list = Array.isArray(value)
    ? value
    : String(value || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
  return [...new Set(list.map((s) => String(s).trim().slice(0, maxLen)))].slice(
    0,
    maxItems,
  );
}

function optionalDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function sanitizeProspectInput(body = {}, { partial = false } = {}) {
  const out = {};

  const set = (key, val, emptyOk = true) => {
    if (val === undefined) return;
    if (!emptyOk && !val && val !== 0) return;
    out[key] = val;
  };

  if (!partial || body.businessName !== undefined) {
    const name = clampString(body.businessName, 160);
    if (name) out.businessName = name;
    else if (!partial) out.businessName = "";
  }
  if (!partial || body.contactName !== undefined) {
    set("contactName", clampString(body.contactName, 120));
  }
  if (!partial || body.phone !== undefined) set("phone", clampString(body.phone, 40));
  if (!partial || body.email !== undefined) {
    const email = clampString(body.email, 254).toLowerCase();
    out.email = email && EMAIL_RE.test(email) ? email : "";
  }
  if (!partial || body.whatsapp !== undefined) {
    set("whatsapp", clampString(body.whatsapp, 40));
  }
  if (!partial || body.website !== undefined) {
    set("website", clampString(body.website, 300));
  }
  if (!partial || body.country !== undefined) set("country", clampString(body.country, 80));
  if (!partial || body.city !== undefined) set("city", clampString(body.city, 80));
  if (!partial || body.address !== undefined) set("address", clampString(body.address, 240));

  if (!partial || body.propertyCount !== undefined) {
    set("propertyCount", asInt(body.propertyCount, partial ? undefined : 1, 0, 5000));
    if (out.propertyCount === undefined) delete out.propertyCount;
  }
  if (!partial || body.propertyTypes !== undefined) {
    set("propertyTypes", asStringArray(body.propertyTypes));
  }
  if (!partial || body.estimatedListings !== undefined) {
    if (body.estimatedListings === "" || body.estimatedListings == null) {
      if (partial) out.estimatedListings = null;
    } else {
      set("estimatedListings", asInt(body.estimatedListings, null, 0, 5000));
    }
  }
  if (!partial || body.existingPlatforms !== undefined) {
    set("existingPlatforms", asStringArray(body.existingPlatforms));
  }
  if (!partial || body.estimatedBookingVolume !== undefined) {
    set("estimatedBookingVolume", clampString(body.estimatedBookingVolume, 80));
  }
  if (!partial || body.estimatedMonthlyRevenue !== undefined) {
    set("estimatedMonthlyRevenue", clampString(body.estimatedMonthlyRevenue, 80));
  }
  if (!partial || body.propertyNotes !== undefined) {
    set("propertyNotes", clampString(body.propertyNotes, 4000));
  }

  if (!partial || body.source !== undefined) {
    const source = String(body.source || "other");
    set("source", SOURCE_IDS.includes(source) ? source : "other");
  }
  if (!partial || body.sourceUrl !== undefined) {
    set("sourceUrl", clampString(body.sourceUrl, 500));
  }
  if (!partial || body.discoveryMethod !== undefined) {
    set("discoveryMethod", clampString(body.discoveryMethod, 400));
  }
  if (body.assignedTo !== undefined) {
    out.assignedTo = actorPayload(body.assignedTo) || null;
  }
  if (!partial || body.priority !== undefined) {
    const priority = String(body.priority || "medium");
    set("priority", PRIORITY_IDS.includes(priority) ? priority : "medium");
  }
  if (!partial || body.stage !== undefined) {
    const stage = String(body.stage || "new");
    set("stage", STAGE_IDS.includes(stage) ? stage : "new");
  }

  if (!partial || body.preferredContactMethod !== undefined) {
    const method = String(body.preferredContactMethod || "whatsapp");
    set(
      "preferredContactMethod",
      CONTACT_METHOD_IDS.includes(method) ? method : "whatsapp",
    );
  }
  if (!partial || body.bestTimeToContact !== undefined) {
    set("bestTimeToContact", clampString(body.bestTimeToContact, 80));
  }
  if (!partial || body.contactStatus !== undefined) {
    const status = String(body.contactStatus || "not_contacted");
    set(
      "contactStatus",
      CONTACT_STATUS_IDS.includes(status) ? status : "not_contacted",
    );
  }
  if (body.awaitingReply !== undefined) {
    out.awaitingReply = Boolean(body.awaitingReply);
  }

  if (body.lastContactAt !== undefined) {
    out.lastContactAt = optionalDate(body.lastContactAt);
  }
  if (body.nextFollowUpAt !== undefined) {
    out.nextFollowUpAt = optionalDate(body.nextFollowUpAt);
    if (out.nextFollowUpAt && body.followUpStatus === undefined) {
      out.followUpStatus = "open";
    }
  }
  if (!partial || body.followUpReason !== undefined) {
    set("followUpReason", clampString(body.followUpReason, 240));
  }
  if (body.followUpReminder !== undefined) {
    out.followUpReminder = Boolean(body.followUpReminder);
  }
  if (!partial || body.followUpNotes !== undefined) {
    set("followUpNotes", clampString(body.followUpNotes, 2000));
  }
  if (body.followUpStatus !== undefined) {
    const st = String(body.followUpStatus);
    if (["open", "completed", "cancelled"].includes(st)) out.followUpStatus = st;
  }
  if (!partial || body.notes !== undefined) {
    set("notes", clampString(body.notes, 8000));
  }
  if (body.painPoint !== undefined) {
    set("painPoint", clampString(body.painPoint, 80));
  }
  if (body.lookingForBookings !== undefined) {
    const look = String(body.lookingForBookings || "");
    if (["yes", "maybe", "no"].includes(look)) out.lookingForBookings = look;
  }
  if (body.callResult !== undefined) {
    set("callResult", clampString(body.callResult, 40));
  }
  if (body.copilotMemory !== undefined && body.copilotMemory && typeof body.copilotMemory === "object") {
    out.copilotMemory = body.copilotMemory;
  }
  if (body.archived !== undefined) out.archived = Boolean(body.archived);

  return out;
}

export function combineFollowUp(dateStr, timeStr) {
  if (!dateStr) return null;
  const time = /^\d{2}:\d{2}$/.test(String(timeStr || ""))
    ? timeStr
    : "09:00";
  const d = new Date(`${dateStr}T${time}:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function serializeProspect(doc) {
  if (!doc) return null;
  const assigned = doc.assignedTo || null;
  return {
    id: String(doc._id),
    businessName: doc.businessName || "",
    contactName: doc.contactName || "",
    phone: doc.phone || "",
    email: doc.email || "",
    whatsapp: doc.whatsapp || "",
    website: doc.website || "",
    country: doc.country || "",
    city: doc.city || "",
    address: doc.address || "",
    propertyCount: doc.propertyCount ?? 1,
    propertyTypes: doc.propertyTypes || [],
    estimatedListings: doc.estimatedListings ?? null,
    existingPlatforms: doc.existingPlatforms || [],
    estimatedBookingVolume: doc.estimatedBookingVolume || "",
    estimatedMonthlyRevenue: doc.estimatedMonthlyRevenue || "",
    propertyNotes: doc.propertyNotes || "",
    source: doc.source || "other",
    sourceUrl: doc.sourceUrl || "",
    discoveryMethod: doc.discoveryMethod || "",
    assignedTo: assigned
      ? {
          id: assigned.id || null,
          email: assigned.email || null,
          name: assigned.name || null,
        }
      : null,
    priority: doc.priority || "medium",
    stage: doc.stage || "new",
    preferredContactMethod: doc.preferredContactMethod || "whatsapp",
    bestTimeToContact: doc.bestTimeToContact || "",
    contactStatus: doc.contactStatus || "not_contacted",
    awaitingReply: Boolean(doc.awaitingReply),
    lastContactAt: doc.lastContactAt || null,
    nextFollowUpAt: doc.nextFollowUpAt || null,
    followUpReason: doc.followUpReason || "",
    followUpReminder: doc.followUpReminder !== false,
    followUpNotes: doc.followUpNotes || "",
    followUpStatus: doc.followUpStatus || "open",
    notes: doc.notes || "",
    painPoint: doc.painPoint || "",
    lookingForBookings: doc.lookingForBookings || "",
    callResult: doc.callResult || "",
    copilotMemory: doc.copilotMemory || {},
    archived: Boolean(doc.archived),
    convertedUser: doc.convertedUser ? String(doc.convertedUser) : null,
    convertedAt: doc.convertedAt || null,
    convertedPropertyCount: doc.convertedPropertyCount ?? null,
    createdBy: doc.createdBy || null,
    createdAt: doc.createdAt || null,
    updatedAt: doc.updatedAt || null,
  };
}

export function serializeActivity(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    prospect: String(doc.prospect),
    type: doc.type,
    description: doc.description,
    meta: doc.meta || null,
    actor: doc.actor || null,
    createdAt: doc.createdAt,
  };
}

export function prospectMatchQuery({
  q,
  stage,
  source,
  priority,
  city,
  assignedTo,
  kpi,
  followup,
  lastContacted,
  propertyCountMin,
  propertyCountMax,
  archived,
} = {}) {
  const query = {};
  if (archived === "1" || archived === true) query.archived = true;
  else query.archived = { $ne: true };

  if (stage && STAGE_IDS.includes(stage)) query.stage = stage;
  if (source && SOURCE_IDS.includes(source)) query.source = source;
  if (priority && PRIORITY_IDS.includes(priority)) query.priority = priority;
  if (city) {
    query.city = new RegExp(escapeRegex(city), "i");
  }
  if (assignedTo) {
    query["assignedTo.id"] = String(assignedTo);
  }

  const min = Number(propertyCountMin);
  const max = Number(propertyCountMax);
  if (Number.isFinite(min) || Number.isFinite(max)) {
    query.propertyCount = {};
    if (Number.isFinite(min)) query.propertyCount.$gte = min;
    if (Number.isFinite(max)) query.propertyCount.$lte = max;
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  if (kpi === "new") query.stage = "new";
  if (kpi === "to_contact") query.stage = { $in: ["new", "researching", "ready"] };
  if (kpi === "contacted") query.stage = "contacted";
  if (kpi === "interested") query.stage = { $in: ["interested", "negotiating"] };
  if (kpi === "onboarding") query.stage = "onboarding";
  if (kpi === "converted") query.stage = "converted";
  if (kpi === "lost") query.stage = "lost";
  if (kpi === "follow_up_due") {
    query.nextFollowUpAt = { $ne: null, $lte: todayEnd };
    query.followUpStatus = "open";
    query.stage = { $nin: ["converted", "lost"] };
  }

  if (followup === "today") {
    query.nextFollowUpAt = { $gte: todayStart, $lte: todayEnd };
    query.followUpStatus = "open";
  } else if (followup === "upcoming") {
    query.nextFollowUpAt = { $gt: todayEnd };
    query.followUpStatus = "open";
  } else if (followup === "overdue") {
    query.nextFollowUpAt = { $ne: null, $lt: todayStart };
    query.followUpStatus = "open";
  } else if (followup === "completed") {
    query.followUpStatus = "completed";
  }

  if (lastContacted === "never") {
    query.lastContactAt = null;
  } else if (lastContacted === "7d") {
    const since = new Date(now);
    since.setDate(since.getDate() - 7);
    query.lastContactAt = { $gte: since };
  } else if (lastContacted === "30d") {
    const since = new Date(now);
    since.setDate(since.getDate() - 30);
    query.lastContactAt = { $gte: since };
  } else if (lastContacted === "stale") {
    const since = new Date(now);
    since.setDate(since.getDate() - 14);
    query.lastContactAt = { $lt: since };
    query.stage = { $nin: ["converted", "lost", "new"] };
  }

  const term = String(q || "").trim().slice(0, 120);
  if (term) {
    const rx = new RegExp(escapeRegex(term), "i");
    query.$or = [
      { businessName: rx },
      { contactName: rx },
      { phone: rx },
      { email: rx },
      { city: rx },
      { website: rx },
      { whatsapp: rx },
    ];
  }

  return query;
}
