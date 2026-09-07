import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import { assertVerifiedHost } from "@/utils/availability/propertyAccess";
import CleaningReview from "@/models/CleaningReview";
import CleaningJob from "@/models/CleaningJob";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    const verified = assertVerifiedHost(session);
    if (!verified.ok) {
      return Response.json({ error: verified.message }, { status: verified.status });
    }

    const reviews = await CleaningReview.find({ hostId: session.user.id })
      .populate("cleanerId", "username image")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const jobIds = reviews.map((review) => review.jobId);
    const jobs = await CleaningJob.find({ _id: { $in: jobIds } })
      .select("propertyName scheduledDate")
      .lean();
    const jobById = new Map(jobs.map((job) => [String(job._id), job]));

    return Response.json({
      reviews: reviews.map((review) => ({
        _id: String(review._id),
        overall: review.overall,
        categories: review.categories || {},
        text: review.text || "",
        fromRole: review.fromRole,
        createdAt: review.createdAt,
        cleaner: review.cleanerId
          ? {
              _id: String(review.cleanerId._id),
              name: review.cleanerId.username,
              image: review.cleanerId.image,
            }
          : null,
        job: jobById.get(String(review.jobId))
          ? {
              _id: String(review.jobId),
              propertyName: jobById.get(String(review.jobId)).propertyName,
              scheduledDate: jobById.get(String(review.jobId)).scheduledDate,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("GET /api/host/cleaning/reviews", error);
    return Response.json({ error: "Failed to load reviews" }, { status: 500 });
  }
}
