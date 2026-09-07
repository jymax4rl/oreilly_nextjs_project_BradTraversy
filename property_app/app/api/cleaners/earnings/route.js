import connectToDatabase from "@/config/database";
import { getCleanerSession } from "@/utils/cleaners/auth";
import CleaningJob from "@/models/CleaningJob";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();
    const auth = await getCleanerSession();
    if (!auth.ok) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const jobs = await CleaningJob.find({
      cleanerId: auth.user._id,
      status: { $in: ["completed", "issue_reported"] },
    })
      .select("agreedPrice currency paymentStatus scheduledDate propertyName")
      .sort({ scheduledDate: -1 })
      .limit(200)
      .lean();

    const monthJobs = jobs.filter((job) => job.scheduledDate >= monthStart);
    const sum = (list) =>
      list.reduce((total, job) => total + (Number(job.agreedPrice) || 0), 0);

    return Response.json({
      currency: jobs[0]?.currency || "GMD",
      thisMonth: sum(monthJobs),
      completed: jobs.length,
      pending: sum(jobs.filter((job) => job.paymentStatus !== "paid")),
      jobs: jobs.slice(0, 40).map((job) => ({
        _id: String(job._id),
        propertyName: job.propertyName,
        scheduledDate: job.scheduledDate,
        agreedPrice: job.agreedPrice,
        currency: job.currency,
        paymentStatus: job.paymentStatus,
      })),
    });
  } catch (error) {
    console.error("GET cleaner earnings", error);
    return Response.json({ error: "Failed to load earnings" }, { status: 500 });
  }
}
