import HostProspect from "@/models/HostProspect";
import HostProspectActivity from "@/models/HostProspectActivity";
import { requireOpsApi } from "@/utils/ops/requireOpsApi";
import { startOfDay, endOfDay } from "@/utils/acquisition/prospects";
import { ACQUISITION_SOURCES, SOURCE_IDS } from "@/utils/acquisition/constants";

function pct(part, whole) {
  if (!whole) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

function weekAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d;
}

/**
 * GET /api/ops/acquisition/summary
 * KPIs, today's actions, source analytics, weekly insights.
 */
export async function GET() {
  try {
    const gate = await requireOpsApi();
    if (gate.error) return gate.error;

    const active = { archived: { $ne: true } };
    const todayStart = startOfDay();
    const todayEnd = endOfDay();
    const sinceWeek = weekAgo();

    const [
      total,
      newCount,
      toContact,
      contacted,
      followUpDue,
      interested,
      onboarding,
      converted,
      lost,
      overdue,
      dueToday,
      awaiting,
      highPriority,
      addedThisWeek,
      sourceGroups,
      weeklyTouched,
      convertedThisWeek,
      sourceConverted,
    ] = await Promise.all([
      HostProspect.countDocuments(active),
      HostProspect.countDocuments({ ...active, stage: "new" }),
      HostProspect.countDocuments({
        ...active,
        stage: { $in: ["new", "researching", "ready"] },
      }),
      HostProspect.countDocuments({ ...active, stage: "contacted" }),
      HostProspect.countDocuments({
        ...active,
        followUpStatus: "open",
        nextFollowUpAt: { $ne: null, $lte: todayEnd },
        stage: { $nin: ["converted", "lost"] },
      }),
      HostProspect.countDocuments({
        ...active,
        stage: { $in: ["interested", "negotiating"] },
      }),
      HostProspect.countDocuments({ ...active, stage: "onboarding" }),
      HostProspect.countDocuments({ ...active, stage: "converted" }),
      HostProspect.countDocuments({ ...active, stage: "lost" }),
      HostProspect.find({
        ...active,
        followUpStatus: "open",
        nextFollowUpAt: { $ne: null, $lt: todayStart },
        stage: { $nin: ["converted", "lost"] },
      })
        .sort({ nextFollowUpAt: 1 })
        .limit(12)
        .lean(),
      HostProspect.find({
        ...active,
        followUpStatus: "open",
        nextFollowUpAt: { $gte: todayStart, $lte: todayEnd },
        stage: { $nin: ["converted", "lost"] },
      })
        .sort({ nextFollowUpAt: 1, priority: 1 })
        .limit(12)
        .lean(),
      HostProspect.find({
        ...active,
        awaitingReply: true,
        stage: { $nin: ["converted", "lost"] },
      })
        .sort({ lastContactAt: 1 })
        .limit(12)
        .lean(),
      HostProspect.find({
        ...active,
        priority: "high",
        stage: { $nin: ["converted", "lost"] },
      })
        .sort({ nextFollowUpAt: 1, updatedAt: -1 })
        .limit(12)
        .lean(),
      HostProspect.countDocuments({ ...active, createdAt: { $gte: sinceWeek } }),
      HostProspect.aggregate([
        { $match: active },
        {
          $group: {
            _id: "$source",
            prospects: { $sum: 1 },
            contacted: {
              $sum: {
                $cond: [{ $ne: ["$lastContactAt", null] }, 1, 0],
              },
            },
            interested: {
              $sum: {
                $cond: [
                  { $in: ["$stage", ["interested", "negotiating", "onboarding", "converted"]] },
                  1,
                  0,
                ],
              },
            },
            converted: {
              $sum: { $cond: [{ $eq: ["$stage", "converted"] }, 1, 0] },
            },
            properties: { $sum: { $ifNull: ["$convertedPropertyCount", 0] } },
          },
        },
      ]),
      HostProspect.countDocuments({
        ...active,
        lastContactAt: { $gte: sinceWeek },
      }),
      HostProspect.countDocuments({
        ...active,
        stage: "converted",
        convertedAt: { $gte: sinceWeek },
      }),
      HostProspectActivity.countDocuments({
        type: "owner_replied",
        createdAt: { $gte: sinceWeek },
      }),
    ]);

    const callsToMake = await HostProspect.find({
      ...active,
      stage: { $in: ["new", "researching", "ready", "follow_up"] },
    })
      .sort({ nextFollowUpAt: 1, priority: 1 })
      .limit(12)
      .lean();

    const sourceMap = Object.fromEntries(
      sourceGroups.map((row) => [row._id || "other", row]),
    );
    const sources = ACQUISITION_SOURCES.map((src) => {
      const row = sourceMap[src.id] || {
        prospects: 0,
        contacted: 0,
        interested: 0,
        converted: 0,
        properties: 0,
      };
      return {
        id: src.id,
        label: src.label,
        prospects: row.prospects || 0,
        contacted: row.contacted || 0,
        interested: row.interested || 0,
        converted: row.converted || 0,
        properties: row.properties || 0,
        conversionRate: pct(row.converted || 0, row.prospects || 0),
        contactRate: pct(row.contacted || 0, row.prospects || 0),
      };
    }).filter((row) => SOURCE_IDS.includes(row.id));

    const closed = converted + lost;
    const conversionRate = pct(converted, total);

    const slim = (docs) =>
      docs.map((d) => ({
        id: String(d._id),
        businessName: d.businessName,
        contactName: d.contactName,
        city: d.city,
        country: d.country,
        phone: d.phone,
        whatsapp: d.whatsapp,
        email: d.email,
        stage: d.stage,
        priority: d.priority,
        source: d.source,
        nextFollowUpAt: d.nextFollowUpAt,
        lastContactAt: d.lastContactAt,
        followUpReason: d.followUpReason,
      }));

    return Response.json({
      kpis: {
        total,
        new: newCount,
        to_contact: toContact,
        contacted,
        follow_up_due: followUpDue,
        interested,
        onboarding,
        converted,
        lost,
        conversion_rate: conversionRate,
        closed,
      },
      today: {
        followUpsDue: slim(dueToday),
        overdue: slim(overdue),
        calls: slim(callsToMake),
        awaitingReply: slim(awaiting),
        highPriority: slim(highPriority),
      },
      insights: {
        addedThisWeek,
        contactedThisWeek: weeklyTouched,
        repliesThisWeek: sourceConverted,
        convertedThisWeek,
        conversionRate,
        contactRate: pct(weeklyTouched, Math.max(addedThisWeek, 1)),
      },
      sources,
    });
  } catch (error) {
    console.error("acquisition summary GET:", error);
    return Response.json({ error: "Failed to load summary" }, { status: 500 });
  }
}
