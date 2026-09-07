import CleaningNotification from "@/models/CleaningNotification";

export async function notifyCleaning({
  userId,
  jobId,
  kind,
  title,
  body,
}) {
  if (!userId || !kind || !title) return null;
  try {
    return await CleaningNotification.create({
      userId,
      kind,
      title,
      body: body || "",
      jobId: jobId || undefined,
    });
  } catch (error) {
    console.error("Cleaning notification failed:", error);
    return null;
  }
}
