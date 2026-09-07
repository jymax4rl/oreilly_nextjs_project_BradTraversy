import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import { getCleanerSession } from "@/utils/cleaners/auth";
import CleanerProfile from "@/models/CleanerProfile";
import User from "@/models/User";
import {
  CLEANER_SPECIALTIES,
  CLEANING_TYPES,
  WEEKDAYS,
} from "@/utils/cleaners/constants";
import { serializeCleanerProfile } from "@/utils/cleaners/serialize";
import { ensureCleanerProfile } from "@/utils/cleaners/inviteFlow";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();
    const auth = await getCleanerSession();
    if (!auth.ok) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }
    const profile = await ensureCleanerProfile(auth.user);
    return Response.json({
      profile: serializeCleanerProfile(profile.toObject?.() || profile, auth.user),
    });
  } catch (error) {
    console.error("GET /api/cleaners/me", error);
    return Response.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    await connectToDatabase();
    const auth = await getCleanerSession();
    if (!auth.ok) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const profile = await ensureCleanerProfile(auth.user);

    if (body.firstName != null) profile.firstName = String(body.firstName).slice(0, 80);
    if (body.lastName != null) profile.lastName = String(body.lastName).slice(0, 80);
    if (body.bio != null) profile.bio = String(body.bio).slice(0, 2000);
    if (body.location != null) profile.location = String(body.location).slice(0, 160);
    if (Array.isArray(body.languages)) {
      profile.languages = body.languages.map((item) => String(item).slice(0, 40)).slice(0, 12);
    }
    if (body.yearsExperience != null) {
      profile.yearsExperience = Math.min(60, Math.max(0, Number(body.yearsExperience) || 0));
    }
    if (Array.isArray(body.specialties)) {
      profile.specialties = body.specialties.filter((item) =>
        CLEANER_SPECIALTIES.includes(item),
      );
    }
    if (body.availability && typeof body.availability === "object") {
      for (const day of WEEKDAYS) {
        if (body.availability[day]) {
          profile.availability[day] = {
            available: Boolean(body.availability[day].available),
            start: body.availability[day].start || "08:00",
            end: body.availability[day].end || "18:00",
          };
        }
      }
    }
    if (Array.isArray(body.unavailableDates)) {
      profile.unavailableDates = body.unavailableDates
        .filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day))
        .slice(0, 120);
    }
    if (body.maxDailyJobs != null) {
      profile.maxDailyJobs = Math.min(20, Math.max(1, Number(body.maxDailyJobs) || 4));
    }
    if (body.minNoticeHours != null) {
      profile.minNoticeHours = Math.min(168, Math.max(0, Number(body.minNoticeHours) || 0));
    }
    if (body.preferredRadiusKm != null) {
      profile.preferredRadiusKm = Math.min(
        500,
        Math.max(1, Number(body.preferredRadiusKm) || 25),
      );
    }
    if (Array.isArray(body.availableTypes)) {
      profile.availableTypes = body.availableTypes.filter((item) =>
        CLEANING_TYPES.includes(item),
      );
    }
    if (typeof body.discoverable === "boolean") {
      profile.discoverable = body.discoverable;
    }

    await profile.save();

    if (body.firstName || body.lastName) {
      const display = [profile.firstName, profile.lastName].filter(Boolean).join(" ");
      if (display) {
        await User.updateOne({ _id: auth.user._id }, { $set: { username: display } });
      }
    }

    const session = await getServerSession(authOptions);
    return Response.json({
      profile: serializeCleanerProfile(profile.toObject(), {
        ...auth.user,
        username: [profile.firstName, profile.lastName].filter(Boolean).join(" "),
      }),
      sessionEmail: session?.user?.email,
    });
  } catch (error) {
    console.error("PATCH /api/cleaners/me", error);
    return Response.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
