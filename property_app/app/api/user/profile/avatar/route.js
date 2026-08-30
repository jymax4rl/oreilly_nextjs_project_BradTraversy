import connectToDatabase from "@/config/database";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { getProfilePayload } from "@/utils/user/getProfilePayload";
import { isCloudinaryConfigured } from "@/utils/cloudinary/cloudinary";
import {
  ALLOWED_MIME,
  MAX_BYTES,
  uploadUserAvatar,
} from "@/utils/cloudinary/uploadUserAvatar";

/**
 * POST /api/user/profile/avatar — multipart field `avatar` → Cloudinary → User.image
 */
export const POST = async (request) => {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (!isCloudinaryConfigured()) {
      return new Response("Image upload is not configured", { status: 503 });
    }

    const formData = await request.formData();
    const file = formData.get("avatar");

    if (!file || typeof file === "string" || !file.arrayBuffer) {
      return new Response("avatar file is required", { status: 400 });
    }

    const mimeType = file.type || "";
    if (!ALLOWED_MIME.has(mimeType)) {
      return new Response("Avatar must be JPEG, PNG, WebP, or GIF", {
        status: 400,
      });
    }

    if (typeof file.size === "number" && file.size > MAX_BYTES) {
      return new Response("Avatar must be 5 MB or smaller", { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length > MAX_BYTES) {
      return new Response("Avatar must be 5 MB or smaller", { status: 400 });
    }

    const uploaded = await uploadUserAvatar({
      buffer,
      filename: file.name || "avatar.jpg",
      userId: session.user.id,
      mimeType,
    });

    const result = await User.updateOne(
      { email: session.user.email },
      { $set: { image: uploaded.url } },
    );

    if (result.matchedCount === 0) {
      return new Response("User not found", { status: 404 });
    }

    const profile = await getProfilePayload(session.user);
    return Response.json({ profile, image: uploaded.url });
  } catch (error) {
    console.error("POST /api/user/profile/avatar error:", error);
    const message =
      error?.message?.startsWith("Avatar") ||
      error?.message?.startsWith("Cloudinary") ||
      error?.message === "Empty file"
        ? error.message
        : "Failed to upload avatar";
    return new Response(message, { status: 500 });
  }
};
