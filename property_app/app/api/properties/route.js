import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import User from "@/models/User";
import { ensurePropertyAvailability } from "@/utils/availability/availabilityService";
import {
  isCloudinaryConfigured,
} from "@/utils/cloudinary/cloudinary";
import {
  hostRootFolder,
  propertyFolder,
  propertyImagesFolder,
} from "@/utils/cloudinary/generateFolderPath";
import {
  uploadPropertyAudio,
  uploadPropertyImage,
} from "@/utils/cloudinary/uploadPropertyMedia";
import {
  parseRatesFromFormData,
  validateRatesPayload,
} from "@/utils/propertyRates";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { writeFile } from "fs/promises";
import path from "path";

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
    const formData = await request.formData();
    const amenities = formData.getAll("amenities");
    const images = formData
      .getAll("images")
      .filter((image) => image.name !== "");
    const audioFile = formData.get("audio");
    const hasAudio =
      audioFile && audioFile.size > 0 && audioFile.name !== "undefined";

    const propertyData = {
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
      beds: formData.get("beds"),
      baths: formData.get("baths"),
      square_feet: formData.get("square_feet"),
      amenities,
      rates: parseRatesFromFormData(formData),
      seller_info: {
        name: formData.get("seller_info.name"),
        email: formData.get("seller_info.email"),
        phone: formData.get("seller_info.phone"),
      },
      owner: hostId,
    };

    const rateValidation = validateRatesPayload(propertyData.rates);
    if (!rateValidation.ok) {
      return new Response(rateValidation.error, { status: 400 });
    }
    propertyData.rates = rateValidation.rates;

    const useCloudinary = isCloudinaryConfigured();
    const newProperty = new Property(propertyData);
    await newProperty.save();

    const propertyId = newProperty._id.toString();

    if (useCloudinary && (images.length > 0 || hasAudio)) {
      const listingFolder = propertyFolder(hostId, propertyId);
      const imagesFolder = propertyImagesFolder(hostId, propertyId);
      const imageEntries = [];

      for (const image of images) {
        const byteData = await image.arrayBuffer();
        const buffer = Buffer.from(byteData);
        const entry = await uploadPropertyImage({
          buffer,
          filename: image.name,
          hostId,
          propertyId,
        });
        imageEntries.push(entry);
      }

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

    await ensurePropertyAvailability(propertyId, hostId);

    return Response.redirect(
      new URL(`/properties/${propertyId}`, request.url),
    );
  } catch (error) {
    console.error("Failed to add property", error);
    return new Response("Failed to add property", { status: 500 });
  }
};
