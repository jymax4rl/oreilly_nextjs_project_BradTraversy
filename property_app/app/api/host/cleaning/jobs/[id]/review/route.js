import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import { assertVerifiedHost } from "@/utils/availability/propertyAccess";
import CleaningJob from "@/models/CleaningJob";
import CleaningReview from "@/models/CleaningReview";
import CleanerProfile from "@/models/CleanerProfile";
import { notifyCleaning } from "@/utils/cleaners/notify";

export async function POST(request, context) {
  const { id } = await context.params;
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    const verified = assertVerifiedHost(session);
    if (!verified.ok) {
      return Response.json({ error: verified.message }, { status: verified.status });
    }

    const job = await CleaningJob.findOne({
      _id: id,
      hostId: session.user.id,
    }).lean();
    if (!job) return Response.json({ error: "Cleaning not found" }, { status: 404 });
    if (!job.cleanerId) {
      return Response.json({ error: "No cleaner to review" }, { status: 400 });
    }
    if (job.status !== "completed" && job.status !== "issue_reported") {
      return Response.json({ error: "Review after the cleaning is finished" }, { status: 400 });
    }

    const existing = await CleaningReview.findOne({
      jobId: job._id,
      fromRole: "host",
    }).lean();
    if (existing) {
      return Response.json({ error: "You already reviewed this cleaning" }, { status: 409 });
    }

    const body = await request.json();
    const overall = Number(body?.overall);
    if (!Number.isFinite(overall) || overall < 1 || overall > 5) {
      return Response.json({ error: "Overall rating must be 1–5" }, { status: 400 });
    }

    const review = await CleaningReview.create({
      jobId: job._id,
      hostId: session.user.id,
      cleanerId: job.cleanerId,
      fromRole: "host",
      categories: body.categories || {},
      overall,
      text: String(body.text || "").slice(0, 2000),
    });

    const stats = await CleaningReview.aggregate([
      { $match: { cleanerId: job.cleanerId, fromRole: "host" } },
      {
        $group: {
          _id: "$cleanerId",
          avg: { $avg: "$overall" },
          count: { $sum: 1 },
        },
      },
    ]);
    if (stats[0]) {
      await CleanerProfile.updateOne(
        { userId: job.cleanerId },
        { $set: { ratingAvg: stats[0].avg, reviewCount: stats[0].count } },
      );
    }

    await notifyCleaning({
      userId: job.cleanerId,
      jobId: job._id,
      kind: "review_received",
      title: "New review from a host",
      body: `${overall} stars · ${job.propertyName}`,
    });

    return Response.json({ reviewId: String(review._id) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/host/cleaning/jobs/[id]/review", error);
    return Response.json({ error: "Failed to save review" }, { status: 500 });
  }
}
