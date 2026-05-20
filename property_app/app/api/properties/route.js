import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import User from "@/models/User";
import { ensurePropertyAvailability } from "@/utils/availability/availabilityService";
import { isCloudinaryConfigured } from "@/utils/cloudinary/cloudinary";
import { createSignedUploadParams } from "@/utils/cloudinary/createUploadSignature";
import {
  hostRootFolder,
  propertyFolder,
  propertyAudioFolder,
  propertyImagesFolder,
} from "@/utils/cloudinary/generateFolderPath";
import {
  uploadPropertyAudio,
  uploadPropertyImage,
} from "@/utils/cloudinary/uploadPropertyMedia";
import {
  applyListingContactChoice,
  resolveSellerInfoForHost,
  validateHostSellerInfo,
} from "@/utils/hostSellerInfo";
import {
  normalizeRates,
  parseRatesFromFormData,
  validateRatesPayload,
} from "@/utils/propertyRates";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { writeFile } from "fs/promises";
import path from "path";

export const maxDuration = 60;

function collectValidationMessages(data, { requireImages }) {
  const messages = [];
  if (!data.type) messages.push("Choose a property type.");
  if (!String(data.name || "").trim()) messages.push("Enter a listing name.");
  if (!String(data.description || "").trim()) {
    messages.push("Enter a description.");
  }
  if (!String(data.location?.city || "").trim()) {
    messages.push("Enter the city.");
  }
  if (!String(data.location?.state || "").trim()) {
    messages.push("Enter the state or county.");
  }
  const beds = Number(data.beds);
  const baths = Number(data.baths);
  const squareFeet = Number(data.square_feet);
  if (!Number.isFinite(beds) || beds <= 0) {
    messages.push("Enter the number of beds.");
  }
  if (!Number.isFinite(baths) || baths <= 0) {
    messages.push("Enter the number of baths.");
  }
  if (!Number.isFinite(squareFeet) || squareFeet <= 0) {
    messages.push("Enter the square footage.");
  }
  if (requireImages && (!data.imageCount || data.imageCount < 1)) {
    messages.push("Add at least one property photo.");
  }
  return { messages, beds, baths, squareFeet };
}

async function saveImagesLocally(images) {
  const imageUrls = [];
  for (const image of images) {
    const byteData = await image.arrayBuffer();
    const buffer = Buffer.from(byteData);
    const filename = Date.now() + "_" + image.name.replace(/\s/g, "_");
    const filePath = path.join(process.cwd(), "public/properties", filename);
    await writeFile(filePath, buffer);
    imageUrls.push(filename);
  }
  return imageUrls;
}

async function saveAudioLocally(audioFile) {
  const audioByteData = await audioFile.arrayBuffer();
  const audioBuffer = Buffer.from(audioByteData);
  const audioFilename =
    Date.now() + "_" + audioFile.name.replace(/\s/g, "_");
  const audioFilePath = path.join(
    process.cwd(),
    "public/audio/properties",
    audioFilename,
  );
  await writeFile(audioFilePath, audioBuffer);
  return audioFilename;
}

async function savePropertyAndAvailability(propertyData, hostId) {
  const newProperty = new Property(propertyData);
  await newProperty.save();
  const propertyId = newProperty._id.toString();
  await ensurePropertyAvailability(propertyId, hostId);
  return propertyId;
}

function parseContactChoice(body) {
  const contact = body?.contact;
  if (!contact || contact.mode !== "custom") {
    return { mode: "profile" };
  }
  return {
    mode: "custom",
    email: String(contact.email || "").trim(),
    phone: String(contact.phone || "").trim(),
  };
}

function parseContactFromFormData(formData) {
  const mode = formData.get("contact.mode");
  if (mode !== "custom") {
    return { mode: "profile" };
  }
  return {
    mode: "custom",
    email: String(formData.get("contact.email") || "").trim(),
    phone: String(formData.get("contact.phone") || "").trim(),
  };
}

async function withHostSellerInfo(propertyData, hostId, contact) {
  const base = await resolveSellerInfoForHost(hostId);
  const seller_info = applyListingContactChoice(base, contact);
  const sellerError = validateHostSellerInfo(seller_info, contact);
  if (sellerError) {
    return { error: sellerError };
  }
  return {
    data: {
      ...propertyData,
      seller_info,
      owner: hostId,
    },
  };
}

/** JSON create: listing metadata only; browser uploads media straight to Cloudinary. */
async function handleJsonCreate(request, hostId) {
  const body = await request.json();
  const imageCount = Number(body.imageCount) || 0;
  const hasAudio = Boolean(body.hasAudio);

  const { messages, beds, baths, squareFeet } = collectValidationMessages(
    {
      ...body,
      imageCount,
    },
    { requireImages: true },
  );
  if (messages.length > 0) {
    return new Response(messages.join(" "), { status: 400 });
  }

  const rateValidation = validateRatesPayload(normalizeRates(body.rates));
  if (!rateValidation.ok) {
    return new Response(rateValidation.error, { status: 400 });
  }

  const built = await withHostSellerInfo(
    {
      type: body.type,
      name: body.name,
      description: body.description,
      location: {
        street: body.location?.street,
        city: body.location?.city,
        state: body.location?.state,
        zipcode: body.location?.zipcode,
        country: body.location?.country || undefined,
      },
      beds,
      baths,
      square_feet: squareFeet,
      amenities: Array.isArray(body.amenities) ? body.amenities : [],
      rates: rateValidation.rates,
    },
    hostId,
    parseContactChoice(body),
  );
  if (built.error) {
    return new Response(built.error, { status: 400 });
  }
  const propertyData = built.data;

  if (!isCloudinaryConfigured()) {
    return Response.json(
      { error: "Cloudinary is not configured.", useMultipart: true },
      { status: 501 },
    );
  }

  const propertyId = await savePropertyAndAvailability(propertyData, hostId);
  const imagesFolder = propertyImagesFolder(hostId, propertyId);

  const directUpload = {
    images: createSignedUploadParams(imagesFolder, "image"),
  };

  if (hasAudio) {
    directUpload.audio = createSignedUploadParams(
      propertyAudioFolder(hostId, propertyId),
      "video",
    );
  }

  return Response.json({
    propertyId,
    directUpload,
  });
}

/** Legacy: full FormData including files (hits Vercel body size limits with many photos). */
async function handleMultipartCreate(request, hostId) {
  const formData = await request.formData();
  const amenities = formData.getAll("amenities");
  const images = formData
    .getAll("images")
    .filter((image) => image && image.size > 0);
  const audioFile = formData.get("audio");
  const hasAudio =
    audioFile && audioFile.size > 0 && audioFile.name !== "undefined";

  const { messages, beds, baths, squareFeet } = collectValidationMessages(
    {
      type: formData.get("type"),
      name: formData.get("name"),
      description: formData.get("description"),
      location: {
        city: formData.get("location.city"),
        state: formData.get("location.state"),
      },
      beds: formData.get("beds"),
      baths: formData.get("baths"),
      square_feet: formData.get("square_feet"),
      imageCount: images.length,
    },
    { requireImages: true },
  );

  if (messages.length > 0) {
    return new Response(messages.join(" "), { status: 400 });
  }

  const rates = parseRatesFromFormData(formData);
  const rateValidation = validateRatesPayload(rates);
  if (!rateValidation.ok) {
    return new Response(rateValidation.error, { status: 400 });
  }

  const built = await withHostSellerInfo(
    {
      type: formData.get("type"),
      name: formData.get("name"),
      description: formData.get("description"),
      location: {
        street: formData.get("location.street"),
        city: formData.get("location.city"),
        state: formData.get("location.state"),
        zipcode: formData.get("location.zipcode"),
        country: formData.get("location.country") || undefined,
      },
      beds,
      baths,
      square_feet: squareFeet,
      amenities,
      rates: rateValidation.rates,
    },
    hostId,
    parseContactFromFormData(formData),
  );
  if (built.error) {
    return new Response(built.error, { status: 400 });
  }
  const propertyData = built.data;

  const useCloudinary = isCloudinaryConfigured();
  const propertyId = await savePropertyAndAvailability(propertyData, hostId);

  try {
    if (useCloudinary && (images.length > 0 || hasAudio)) {
      const listingFolder = propertyFolder(hostId, propertyId);
      const imagesFolder = propertyImagesFolder(hostId, propertyId);

      const imageEntries = await Promise.all(
        images.map(async (image) => {
          const byteData = await image.arrayBuffer();
          const buffer = Buffer.from(byteData);
          return uploadPropertyImage({
            buffer,
            filename: image.name || "photo.jpg",
            hostId,
            propertyId,
          });
        }),
      );

      const mediaUpdate = {
        cloudinaryFolder: listingFolder,
        cloudinaryImagesFolder: imagesFolder,
        cloudinaryMigrationStatus: "completed",
      };
      if (imageEntries.length > 0) {
        mediaUpdate.images = imageEntries;
      }

      if (hasAudio) {
        const audioByteData = await audioFile.arrayBuffer();
        const audioBuffer = Buffer.from(audioByteData);
        mediaUpdate.audio = await uploadPropertyAudio({
          buffer: audioBuffer,
          filename: audioFile.name || "recording.wav",
          hostId,
          propertyId,
        });
      }

      await Property.findByIdAndUpdate(propertyId, { $set: mediaUpdate });
      await User.findByIdAndUpdate(hostId, {
        $set: { cloudinaryRootFolder: hostRootFolder(hostId) },
      });
    } else {
      const localUpdate = {};
      if (images.length > 0) {
        localUpdate.images = await saveImagesLocally(images);
      }
      if (hasAudio) {
        localUpdate.audio = await saveAudioLocally(audioFile);
      }
      if (Object.keys(localUpdate).length > 0) {
        await Property.findByIdAndUpdate(propertyId, { $set: localUpdate });
      }
    }
  } catch (mediaError) {
    await Property.findByIdAndDelete(propertyId);
    throw mediaError;
  }

  return Response.redirect(
    new URL(`/properties/${propertyId}`, request.url),
  );
}

export const POST = async (request) => {
  try {
    await connectToDatabase();

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (session.user.hostStatus !== "verified") {
      return new Response(
        "Access denied. Only verified hosts can list properties.",
        { status: 403 },
      );
    }

    const hostId = String(session.user.id);
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      return handleJsonCreate(request, hostId);
    }

    return handleMultipartCreate(request, hostId);
  } catch (error) {
    console.error("Failed to add property", error);
    let message = "Failed to add property. Please try again.";
    if (error?.name === "ValidationError") {
      message =
        "Some listing fields are invalid. Check beds, baths, square footage, and pricing.";
    } else if (
      error?.message?.includes("timeout") ||
      error?.code === "ETIMEDOUT"
    ) {
      message =
        "Upload timed out. Try again with fewer photos, or add photos one at a time.";
    } else if (error?.http_code === 400 || error?.message) {
      message =
        "Photo upload failed. Try fewer photos or smaller images, then submit again.";
    }
    return new Response(message, { status: 500 });
  }
};
