import crypto from "crypto";
import User from "@/models/User";
import CleanerProfile from "@/models/CleanerProfile";
import HostCleanerLink from "@/models/HostCleanerLink";
import CleaningInvite from "@/models/CleaningInvite";
import { INVITE_TTL_MS, defaultWeekAvailability } from "@/utils/cleaners/constants";
import { notifyCleaning } from "@/utils/cleaners/notify";
import { sendCleanerInviteEmail } from "@/utils/cleaners/inviteEmail";

function splitName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

export async function ensureCleanerProfile(user, extras = {}) {
  const existing = await CleanerProfile.findOne({ userId: user._id });
  if (existing) {
    if (extras.firstName && !existing.firstName) existing.firstName = extras.firstName;
    if (extras.lastName && !existing.lastName) existing.lastName = extras.lastName;
    if (extras.photoUrl && !existing.photoUrl) existing.photoUrl = extras.photoUrl;
    await existing.save();
    return existing;
  }
  const fromUser = splitName(user.username || user.name);
  return CleanerProfile.create({
    userId: user._id,
    firstName: extras.firstName || fromUser.firstName,
    lastName: extras.lastName || fromUser.lastName,
    photoUrl: extras.photoUrl || user.image || "",
    availability: defaultWeekAvailability(),
  });
}

export async function activateCleanerAccount(user, extras = {}) {
  if (user.cleanerStatus !== "active") {
    user.cleanerStatus = "active";
  }
  if (user.role === "guest") {
    user.role = "cleaner";
  }
  await user.save();
  await ensureCleanerProfile(user, extras);
  return user;
}

export async function upsertHostCleanerLink({ hostId, cleanerId, status = "active" }) {
  const existing = await HostCleanerLink.findOne({ hostId, cleanerId });
  if (existing) {
    if (existing.status === "inactive" || existing.status === "pending") {
      existing.status = status;
      await existing.save();
    }
    return existing;
  }
  return HostCleanerLink.create({ hostId, cleanerId, status });
}

export async function inviteOrRequestCleaner({
  hostId,
  hostName,
  name,
  email,
  phone,
}) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) {
    return { ok: false, status: 400, error: "A valid email is required" };
  }

  const existingUser = await User.findOne({
    email: { $regex: new RegExp(`^${normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
  });

  if (existingUser && (existingUser.cleanerStatus === "active" || existingUser.role === "cleaner")) {
    const link = await upsertHostCleanerLink({
      hostId,
      cleanerId: existingUser._id,
      status: "pending",
    });
    await notifyCleaning({
      userId: existingUser._id,
      kind: "host_relationship_request",
      title: "A host wants to work with you",
      body: `${hostName || "A host"} invited you to clean their properties.`,
    });
    return {
      ok: true,
      mode: "relationship_request",
      linkId: String(link._id),
    };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const invite = await CleaningInvite.create({
    hostId,
    name: String(name || "").trim(),
    email: normalized,
    phone: String(phone || "").trim(),
    token,
    expiresAt: new Date(Date.now() + INVITE_TTL_MS),
  });

  await sendCleanerInviteEmail({
    to: normalized,
    name: name || "there",
    hostName: hostName || "An Isisel host",
    token,
  });

  return {
    ok: true,
    mode: "invite",
    inviteId: String(invite._id),
  };
}

export async function acceptInvite(token, sessionUser) {
  const invite = await CleaningInvite.findOne({ token }).populate("hostId", "username email");
  if (!invite) return { ok: false, status: 404, error: "Invite not found" };
  if (invite.status !== "pending") {
    return { ok: false, status: 410, error: "This invite is no longer valid" };
  }
  if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
    invite.status = "expired";
    await invite.save();
    return { ok: false, status: 410, error: "This invite has expired" };
  }

  const user = await User.findById(sessionUser.id);
  if (!user) return { ok: false, status: 401, error: "Account not found" };

  const inviteEmail = String(invite.email || "").toLowerCase();
  const userEmail = String(user.email || "").toLowerCase();
  if (inviteEmail && userEmail && inviteEmail !== userEmail) {
    return {
      ok: false,
      status: 403,
      error: "Sign in with the email this invitation was sent to",
    };
  }

  const nameParts = splitName(invite.name);
  await activateCleanerAccount(user, nameParts);
  await upsertHostCleanerLink({
    hostId: invite.hostId._id || invite.hostId,
    cleanerId: user._id,
    status: "active",
  });
  invite.status = "accepted";
  invite.acceptedBy = user._id;
  await invite.save();

  await notifyCleaning({
    userId: invite.hostId._id || invite.hostId,
    kind: "cleaner_joined",
    title: "A cleaner accepted your invite",
    body: user.username || invite.name || user.email,
  });

  return { ok: true };
}

export async function acceptRelationshipRequest(linkId, cleanerId) {
  const link = await HostCleanerLink.findOne({
    _id: linkId,
    cleanerId,
    status: "pending",
  });
  if (!link) return { ok: false, status: 404, error: "Request not found" };
  link.status = "active";
  await link.save();
  await notifyCleaning({
    userId: link.hostId,
    kind: "cleaner_joined",
    title: "A cleaner accepted your request",
    body: "They are now on your trusted cleaners list.",
  });
  return { ok: true, link: link.toObject() };
}
