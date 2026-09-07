import connectToDatabase from "@/config/database";
import { getCleanerSession } from "@/utils/cleaners/auth";
import CleaningNotification from "@/models/CleaningNotification";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();
    const auth = await getCleanerSession();
    if (!auth.ok) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }
    const items = await CleaningNotification.find({ userId: auth.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return Response.json({
      notifications: items.map((item) => ({
        _id: String(item._id),
        kind: item.kind,
        title: item.title,
        body: item.body,
        jobId: item.jobId ? String(item.jobId) : null,
        read: item.read,
        createdAt: item.createdAt,
      })),
    });
  } catch (error) {
    console.error("GET cleaner notifications", error);
    return Response.json({ error: "Failed to load notifications" }, { status: 500 });
  }
}

export async function PATCH() {
  try {
    await connectToDatabase();
    const auth = await getCleanerSession();
    if (!auth.ok) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }
    await CleaningNotification.updateMany(
      { userId: auth.user._id, read: false },
      { $set: { read: true } },
    );
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}
