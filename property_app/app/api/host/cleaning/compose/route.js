import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import { assertVerifiedHost } from "@/utils/availability/propertyAccess";
import Property from "@/models/Property";
import Booking from "@/models/Booking";
import CleaningJob from "@/models/CleaningJob";
import HostCleanerLink from "@/models/HostCleanerLink";
import CleanerProfile from "@/models/CleanerProfile";
import PropertyCleaningSettings from "@/models/PropertyCleaningSettings";
import { serializeCleanerProfile } from "@/utils/cleaners/serialize";
import { planCleaningWindow, SIMPLE_TYPES } from "@/utils/cleaners/schedule";
import { localTodayYmd, addDaysYmd } from "@/utils/host/reservationsCalendar";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    const verified = assertVerifiedHost(session);
    if (!verified.ok) {
      return Response.json({ error: verified.message }, { status: verified.status });
    }

    const hostId = session.user.id;
    const today = localTodayYmd();
    const horizon = addDaysYmd(today, 45);

    const properties = await Property.find({ owner: hostId })
      .select("name location checkOutTime checkInTime")
      .sort({ name: 1 })
      .lean();
    const propertyIds = properties.map((property) => property._id);

    const [bookings, jobs, links, settings] = await Promise.all([
      propertyIds.length
        ? Booking.find({
            propertyId: { $in: propertyIds },
            status: { $in: ["pending", "confirmed"] },
            listed: { $ne: false },
            checkOut: { $gte: today, $lte: horizon },
          })
            .select("propertyId checkIn checkOut status")
            .sort({ checkOut: 1 })
            .lean()
        : [],
      propertyIds.length
        ? CleaningJob.find({
            hostId,
            reservationId: { $ne: null },
            status: { $ne: "cancelled" },
            cleaningType: "checkout",
          })
            .select("reservationId")
            .lean()
        : [],
      HostCleanerLink.find({ hostId, status: "active" })
        .populate("cleanerId", "username email image")
        .lean(),
      PropertyCleaningSettings.find({ hostId })
        .select("propertyId estimatedMinutes")
        .lean(),
    ]);

    const covered = new Set(
      jobs.map((job) => String(job.reservationId)).filter(Boolean),
    );
    const settingsByProperty = new Map(
      settings.map((item) => [String(item.propertyId), item]),
    );

    const profileByUser = new Map(
      (
        await CleanerProfile.find({
          userId: { $in: links.map((link) => link.cleanerId?._id).filter(Boolean) },
        }).lean()
      ).map((profile) => [String(profile.userId), profile]),
    );

    const cleaners = links.map((link) => ({
      linkId: String(link._id),
      _id: String(link.cleanerId?._id || ""),
      name:
        profileByUser.get(String(link.cleanerId?._id))?.firstName
          ? [
              profileByUser.get(String(link.cleanerId?._id)).firstName,
              profileByUser.get(String(link.cleanerId?._id)).lastName,
            ]
              .filter(Boolean)
              .join(" ")
          : link.cleanerId?.username || "Cleaner",
      image: link.cleanerId?.image || "",
      assignedPropertyIds: (link.assignedPropertyIds || []).map(String),
      profile: serializeCleanerProfile(
        profileByUser.get(String(link.cleanerId?._id)),
        link.cleanerId,
      ),
    }));

    const staysByProperty = new Map();
    for (const stay of bookings) {
      const key = String(stay.propertyId);
      const list = staysByProperty.get(key) || [];
      list.push(stay);
      staysByProperty.set(key, list);
    }

    const homes = properties.map((property) => {
      const id = String(property._id);
      const checkOutTime = property.checkOutTime || "11:00";
      const checkInTime = property.checkInTime || "15:00";
      const estimatedMinutes = settingsByProperty.get(id)?.estimatedMinutes;
      const stays = (staysByProperty.get(id) || []).map((stay, index, all) => {
        const next = all.find((other) => other.checkIn >= stay.checkOut);
        const windows = {};
        for (const type of SIMPLE_TYPES) {
          windows[type] = planCleaningWindow({
            type,
            checkOutTime,
            checkInTime,
            booking: stay,
            nextBooking: next && String(next._id) !== String(stay._id) ? next : null,
            todayYmd: today,
            settingsMinutes: estimatedMinutes,
          });
        }
        return {
          _id: String(stay._id),
          checkIn: stay.checkIn,
          checkOut: stay.checkOut,
          status: stay.status,
          alreadyCovered: covered.has(String(stay._id)),
          windows,
        };
      });
      return {
        _id: id,
        name: property.name,
        city: property.location?.city || "",
        checkOutTime,
        checkInTime,
        assignedCleanerIds: cleaners
          .filter((cleaner) => cleaner.assignedPropertyIds.includes(id))
          .map((cleaner) => cleaner._id),
        stays,
      };
    });

    return Response.json({ today, homes, cleaners });
  } catch (error) {
    console.error("GET /api/host/cleaning/compose", error);
    return Response.json({ error: "Failed to load cleaning compose" }, { status: 500 });
  }
}
