import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import User from "@/models/User";
import { ensurePropertyAvailability } from "@/utils/availability/availabilityService";
import { isCloudinaryConfigured } from "@/utils/cloudinary/cloudinary";
import {
  hostRootFolder,
  propertyFolder,
  propertyImagesFolder,
} from "@/utils/cloudinary/generateFolderPath";
import { uploadPropertyImage, uploadPropertyAudio } from "@/utils/cloudinary/uploadPropertyMedia";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { computeListingPrice } from "@/utils/listingPricing";
import { uploadPropertyImages } from "@/utils/uploadPropertyImages";
import { softEstimateCoordinates, coerceCoordinate } from "@/utils/address";
import { sendListingSubmittedAdminEmail } from "@/utils/email/sendListingModerationEmails";
import { after } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const maxDuration = 60;

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function str(value) {
  return typeof value === "string" ? value.trim() : "";
}

function asUploadFile(entry, index) {
  if (!entry || typeof entry !== "object" || !("arrayBuffer" in entry)) {
    return null;
  }
  const size = Number(entry.size) || 0;
  if (size <= 0) return null;
  const name =
    (entry.name && String(entry.name).trim()) || `photo_${index + 1}.jpg`;
  return { file: entry, name, size };
}

export const POST = async (request) => {
  let createdPropertyId = null;
  try {
    await connectToDatabase();

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.hostStatus !== "verified") {
      return Response.json(
        { error: "Only verified hosts can list properties." },
        { status: 403 },
      );
    }

    if (!session.user.id) {
      return Response.json(
        { error: "Session is missing a user id. Sign out and sign in again." },
        { status: 401 },
      );
    }

    let formData;
    try {
      formData = await request.formData();
    } catch (parseError) {
      console.error("Listing formData parse failed:", parseError);
      return Response.json(
        {
          error:
            "Could not read the upload (often too large). Use fewer or smaller photos and try again.",
        },
        { status: 413 },
      );
    }

    const amenities = formData.getAll("amenities");
    const imageFiles = formData
      .getAll("images")
      .map((image, index) => asUploadFile(image, index))
      .filter(Boolean)
      .map((entry) => {
        // Ensure File-like objects always expose a usable name for Cloudinary.
        if (entry.file instanceof File && entry.file.name) return entry.file;
        return new File([entry.file], entry.name, {
          type: entry.file.type || "image/jpeg",
        });
      });

    const type = str(formData.get("type"));
    const name = str(formData.get("name"));
    const street = str(formData.get("location.street"));
    const city = str(formData.get("location.city"));
    const country = str(formData.get("location.country"));
    const beds = num(formData.get("beds"));
    const baths = num(formData.get("baths"));

    if (!type) {
      return Response.json({ error: "Property type is required." }, { status: 400 });
    }
    if (!name) {
      return Response.json({ error: "Listing title is required." }, { status: 400 });
    }
    if (!street || !city || !country) {
      return Response.json(
        { error: "A complete address (street, city, country) is required." },
        { status: 400 },
      );
    }
    if (!beds || !baths) {
      return Response.json(
        { error: "Beds and bathrooms are required." },
        { status: 400 },
      );
    }
    if (imageFiles.length === 0) {
      return Response.json(
        { error: "At least one photo is required." },
        { status: 400 },
      );
    }

    const rates = {
      nightly: num(formData.get("rates.nightly")),
      weekly: num(formData.get("rates.weekly")),
      monthly: num(formData.get("rates.monthly")),
      weekendPremium: num(formData.get("rates.weekendPremium")) || 0,
    };

    if (!rates.nightly || rates.nightly <= 0) {
      return Response.json(
        { error: "A valid nightly price is required." },
        { status: 400 },
      );
    }

    let lat = coerceCoordinate(formData.get("location.lat"));
    let lng = coerceCoordinate(formData.get("location.lng"));
    if (lat == null || lng == null) {
      const soft = softEstimateCoordinates({
        street,
        city,
        state: str(formData.get("location.state")),
        zipcode: str(formData.get("location.zipcode")),
        country,
      });
      lat = soft.lat;
      lng = soft.lng;
    }
    const hostId = String(session.user.id);

    const audioFile = formData.get("audio");
    const hasAudio =
      audioFile &&
      typeof audioFile === "object" &&
      "arrayBuffer" in audioFile &&
      Number(audioFile.size) > 0;

    const propertyData = {
      type,
      name,
      description: str(formData.get("description")),
      location: {
        street,
        streetLine2: str(formData.get("location.streetLine2")) || undefined,
        city,
        state: str(formData.get("location.state")) || undefined,
        zipcode: str(formData.get("location.zipcode")) || undefined,
        country,
        formatted:
          str(formData.get("location.formatted")) ||
          [street, city, country].filter(Boolean).join(", "),
        placeId: str(formData.get("location.placeId")) || undefined,
        lat,
        lng,
        showExactLocation:
          formData.get("location.showExactLocation") === "true",
      },
      listing: {
        privacyType: str(formData.get("listing.privacyType")) || "entire_place",
        maxGuests: num(formData.get("listing.maxGuests")) || 2,
        bedroomHasLock: formData.get("listing.bedroomHasLock") === "true",
      },
      beds,
      baths,
      square_feet: num(formData.get("square_feet")) || 500,
      amenities,
      rates,
      listingPrice: computeListingPrice(rates),
      seller_info: {
        name: str(formData.get("seller_info.name")) || session.user.name || "",
        email:
          str(formData.get("seller_info.email")) || session.user.email || "",
        phone: str(formData.get("seller_info.phone")),
      },
      owner: hostId,
      status: "pending",
      listingModerationRequestedAt: new Date(),
    };

    const newProperty = new Property(propertyData);
    await newProperty.save();
    createdPropertyId = newProperty._id.toString();

    const propertyId = createdPropertyId;
    let images = [];

    try {
      if (isCloudinaryConfigured()) {
        const imageEntries = [];
        for (const image of imageFiles) {
          const byteData = await image.arrayBuffer();
          const buffer = Buffer.from(byteData);
          const entry = await uploadPropertyImage({
            buffer,
            filename: image.name || `photo_${imageEntries.length + 1}.jpg`,
            hostId,
            propertyId,
          });
          imageEntries.push(entry);
        }
        images = imageEntries;

        await Property.findByIdAndUpdate(propertyId, {
          $set: {
            images: imageEntries,
            cloudinaryFolder: propertyFolder(hostId, propertyId),
            cloudinaryImagesFolder: propertyImagesFolder(hostId, propertyId),
            cloudinaryMigrationStatus: "completed",
          },
        });

        await User.findByIdAndUpdate(hostId, {
          $set: { cloudinaryRootFolder: hostRootFolder(hostId) },
        }).catch(() => {});
      } else {
        images = await uploadPropertyImages(imageFiles);
        if (images.length > 0) {
          await Property.findByIdAndUpdate(propertyId, { $set: { images } });
        }
      }
    } catch (uploadError) {
      console.error("Listing image upload failed:", uploadError);
      await Property.findByIdAndDelete(propertyId).catch(() => {});
      createdPropertyId = null;
      const detail =
        uploadError?.message ||
        "Image upload failed. Check Cloudinary credentials and try again.";
      return Response.json({ error: detail }, { status: 500 });
    }

    newProperty.images = images;

    if (hasAudio) {
      try {
        const byteData = await audioFile.arrayBuffer();
        const buffer = Buffer.from(byteData);
        const audioName =
          (audioFile.name && String(audioFile.name)) || "recording.webm";

        if (isCloudinaryConfigured()) {
          const audioEntry = await uploadPropertyAudio({
            buffer,
            filename: audioName,
            hostId,
            propertyId,
          });
          await Property.findByIdAndUpdate(propertyId, {
            $set: { audio: audioEntry },
          });
          newProperty.audio = audioEntry;
        } else {
          const audioDir = path.join(process.cwd(), "public/audio/properties");
          await mkdir(audioDir, { recursive: true });
          const safeName = `${Date.now()}_${audioName.replace(/\s/g, "_")}`;
          await writeFile(path.join(audioDir, safeName), buffer);
          await Property.findByIdAndUpdate(propertyId, {
            $set: { audio: safeName },
          });
          newProperty.audio = safeName;
        }
      } catch (audioError) {
        console.error("Audio upload warning:", audioError?.message || audioError);
      }
    }

    try {
      await ensurePropertyAvailability(newProperty._id.toString());
    } catch (availabilityError) {
      console.error("Availability init warning:", availabilityError);
    }

    // Notify admins after the response (Vercel/Next keep the isolate alive via after()).
    // Plain fire-and-forget often never finishes once the handler returns.
    const notifyPayload = {
      propertyId: newProperty._id.toString(),
      propertyName: newProperty.name,
      hostName: session.user.name || propertyData.seller_info?.name,
      hostEmail: session.user.email || propertyData.seller_info?.email,
    };
    after(async () => {
      try {
        const outcome = await sendListingSubmittedAdminEmail(notifyPayload);
        if (!outcome?.sent) {
          console.warn("Listing admin notify incomplete:", {
            propertyId: notifyPayload.propertyId,
            reason: outcome?.reason || "unknown",
            attempted: outcome?.attempted,
          });
        }
      } catch (err) {
        console.error("Listing admin notify warning:", err?.message || err);
      }
    });

    return Response.json({
      success: true,
      id: newProperty._id.toString(),
      status: "pending",
      redirectUrl: `/host/listings`,
    });
  } catch (error) {
    console.error("Failed to add property", error);
    if (createdPropertyId) {
      await Property.findByIdAndDelete(createdPropertyId).catch(() => {});
    }
    const message =
      error?.message || "Failed to add property. Please try again.";
    return Response.json({ error: message }, { status: 500 });
  }
};
