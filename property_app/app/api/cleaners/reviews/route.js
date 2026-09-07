import connectToDatabase from "@/config/database";
import { getCleanerSession } from "@/utils/cleaners/auth";
import CleaningReview from "@/models/CleaningReview";
import CleaningJob from "@/models/CleaningJob";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();
    const auth = await getCleanerSession();
    if (!auth.ok) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }
    const reviews = await CleaningReview.find({
      cleanerId: auth.user._id,
      fromRole: "host",
    })
      .sort({ createdAt: -1 })
      .limit(80)
      .lean();
    const jobs = await CleaningJob.find({
      _id: { $in: reviews.map((review) => review.jobId) },
    })
      .select("propertyName scheduledDate")
      .lean();
    const jobById = new Map(jobs.map((job) => [String(job._id), job]));
    return Response.json({
      reviews: reviews.map((review) => ({
        _id: String(review._id),
        overall: review.overall,
        categories: review.categories || {},
        text: review.text || "",
        createdAt: review.createdAt,
        job: jobById.get(String(review.jobId))
          ? {
              propertyName: jobById.get(String(review.jobId)).propertyName,
              scheduledDate: jobById.get(String(review.jobId)).scheduledDate,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("GET cleaner reviews", error);
    return Response.json({ error: "Failed to load reviews" }, { status: 500 });
  }
}
