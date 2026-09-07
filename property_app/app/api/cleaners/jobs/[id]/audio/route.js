import connectToDatabase from "@/config/database";
import { getCleanerSession } from "@/utils/cleaners/auth";
import CleaningJob from "@/models/CleaningJob";
import { isCloudinaryConfigured } from "@/utils/cloudinary/cloudinary";
import {
  CLEANING_AUDIO_MIMES,
  MAX_CLEANING_AUDIO_BYTES,
  uploadCleaningAudio,
} from "@/utils/cloudinary/uploadCleaningMedia";
import { MAX_AUDIO_SECONDS } from "@/utils/cleaners/constants";
import { notifyCleaning } from "@/utils/cleaners/notify";

export async function POST(request, context) {
  const { id } = await context.params;
  try {
    await connectToDatabase();
    const auth = await getCleanerSession();
    if (!auth.ok) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }
    if (!isCloudinaryConfigured()) {
      return Response.json({ error: "Upload is not configured" }, { status: 503 });
    }

    const job = await CleaningJob.findOne({
      _id: id,
      cleanerId: auth.user._id,
    });
    if (!job) {
      return Response.json({ error: "Cleaning not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("audio");
    const duration = Number(formData.get("duration") || 0);
    if (!file || typeof file === "string" || !file.arrayBuffer) {
      return Response.json({ error: "An audio recording is required" }, { status: 400 });
    }
    if (duration && duration > MAX_AUDIO_SECONDS + 2) {
      return Response.json(
        { error: `Recordings can be up to ${MAX_AUDIO_SECONDS} seconds` },
        { status: 400 },
      );
    }
    const mimeType = file.type || "audio/webm";
    if (mimeType && !CLEANING_AUDIO_MIMES.has(mimeType) && !mimeType.startsWith("audio/")) {
      return Response.json({ error: "Unsupported audio format" }, { status: 400 });
    }
    if (typeof file.size === "number" && file.size > MAX_CLEANING_AUDIO_BYTES) {
      return Response.json({ error: "Recording is too large. Try a shorter clip." }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!buffer.length) {
      return Response.json({ error: "Empty recording" }, { status: 400 });
    }

    const uploaded = await uploadCleaningAudio({
      buffer,
      filename: file.name || "report.webm",
      hostId: job.hostId,
      jobId: String(job._id),
      mimeType,
      duration: duration || null,
    });

    job.audioReports.push({
      url: uploaded.url,
      publicId: uploaded.publicId,
      resourceType: uploaded.resourceType,
      duration: uploaded.duration,
      mimeType: uploaded.mimeType,
      fileSize: uploaded.fileSize,
      createdBy: auth.user._id,
    });
    await job.save();

    await notifyCleaning({
      userId: job.hostId,
      jobId: job._id,
      kind: "audio_report",
      title: "Audio report received",
      body: job.propertyName,
    });

    const audio = job.audioReports[job.audioReports.length - 1];
    return Response.json({
      audio: {
        _id: String(audio._id),
        url: audio.url,
        duration: audio.duration,
        createdAt: audio.createdAt,
      },
    });
  } catch (error) {
    console.error("POST cleaning audio", error);
    return Response.json(
      { error: "Audio upload failed. Your recording was not saved — please try again." },
      { status: 500 },
    );
  }
}

export async function DELETE(request, context) {
  const { id } = await context.params;
  try {
    await connectToDatabase();
    const auth = await getCleanerSession();
    if (!auth.ok) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }
    const audioId = new URL(request.url).searchParams.get("audioId");
    const job = await CleaningJob.findOne({
      _id: id,
      cleanerId: auth.user._id,
    });
    if (!job) {
      return Response.json({ error: "Cleaning not found" }, { status: 404 });
    }
    job.audioReports = job.audioReports.filter(
      (item) => String(item._id) !== String(audioId),
    );
    await job.save();
    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE cleaning audio", error);
    return Response.json({ error: "Failed to remove audio" }, { status: 500 });
  }
}
