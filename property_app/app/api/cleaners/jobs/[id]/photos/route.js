import connectToDatabase from "@/config/database";
import { getCleanerSession } from "@/utils/cleaners/auth";
import CleaningJob from "@/models/CleaningJob";
import { isCloudinaryConfigured } from "@/utils/cloudinary/cloudinary";
import {
  CLEANING_PHOTO_MIMES,
  MAX_CLEANING_PHOTO_BYTES,
  uploadCleaningPhoto,
} from "@/utils/cloudinary/uploadCleaningMedia";
import { MAX_CLEANING_PHOTOS } from "@/utils/cleaners/constants";
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
    if ((job.photos || []).length >= MAX_CLEANING_PHOTOS) {
      return Response.json(
        { error: `You can add up to ${MAX_CLEANING_PHOTOS} photos` },
        { status: 400 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("photo");
    if (!file || typeof file === "string" || !file.arrayBuffer) {
      return Response.json({ error: "A photo is required" }, { status: 400 });
    }
    const mimeType = file.type || "";
    if (mimeType && !CLEANING_PHOTO_MIMES.has(mimeType)) {
      return Response.json({ error: "Use JPEG, PNG, WebP, or HEIC" }, { status: 400 });
    }
    if (typeof file.size === "number" && file.size > MAX_CLEANING_PHOTO_BYTES) {
      return Response.json({ error: "Photo must be 8 MB or smaller" }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!buffer.length) {
      return Response.json({ error: "Empty photo" }, { status: 400 });
    }

    const uploaded = await uploadCleaningPhoto({
      buffer,
      filename: file.name || "cleaning.jpg",
      hostId: job.hostId,
      jobId: String(job._id),
    });

    job.photos.push({
      url: uploaded.url,
      publicId: uploaded.publicId,
      resourceType: uploaded.resourceType,
      mimeType: uploaded.mimeType,
      fileSize: uploaded.fileSize,
      createdBy: auth.user._id,
    });
    await job.save();

    await notifyCleaning({
      userId: job.hostId,
      jobId: job._id,
      kind: "photos_uploaded",
      title: "Cleaning photos uploaded",
      body: job.propertyName,
    });

    const photo = job.photos[job.photos.length - 1];
    return Response.json({
      photo: {
        _id: String(photo._id),
        url: photo.url,
        createdAt: photo.createdAt,
      },
    });
  } catch (error) {
    console.error("POST cleaning photo", error);
    return Response.json({ error: "Photo upload failed. Please try again." }, { status: 500 });
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
    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get("photoId");
    const job = await CleaningJob.findOne({
      _id: id,
      cleanerId: auth.user._id,
    });
    if (!job) {
      return Response.json({ error: "Cleaning not found" }, { status: 404 });
    }
    job.photos = job.photos.filter((photo) => String(photo._id) !== String(photoId));
    await job.save();
    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE cleaning photo", error);
    return Response.json({ error: "Failed to remove photo" }, { status: 500 });
  }
}
