import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import { ensurePropertyAvailability } from "@/utils/availability/availabilityService";
import {
  parseRatesFromFormData,
  validateRatesPayload,
} from "@/utils/propertyRates";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { writeFile } from "fs/promises";
import path from "path";

export const POST = async (request) => {
  try {
    await connectToDatabase();

    // Check for session/user
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }
// HOST VERIFICATION GUARD
    if (session.user.hostStatus !== "verified") {
      return new Response(
        "Access denied. Only verified hosts can list properties.",
        { status: 403 }
      );
    }
    const formData = await request.formData();

    // Access all values from amenities and images
    const amenities = formData.getAll("amenities");
    const images = formData
      .getAll("images")
      .filter((image) => image.name !== "");

    // Create propertyData object
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
      owner: session.user.id,
    };

    // Handle Image Uploads (Local Storage)
    const imageUrls = [];
    for (const image of images) {
      const byteData = await image.arrayBuffer();
      const buffer = Buffer.from(byteData);
      const filename = Date.now() + "_" + image.name.replace(/\s/g, "_");
      const filePath = path.join(
        process.cwd(),
        "public/images/properties",
        filename
      );

      await writeFile(filePath, buffer);
      imageUrls.push(filename);
    }

    propertyData.images = imageUrls;

    // Handle Audio Upload
    const audioFile = formData.get("audio");
    if (audioFile && audioFile.size > 0 && audioFile.name !== "undefined") {
      const audioByteData = await audioFile.arrayBuffer();
      const audioBuffer = Buffer.from(audioByteData);
      const audioFilename =
        Date.now() + "_" + audioFile.name.replace(/\s/g, "_");
      const audioFilePath = path.join(
        process.cwd(),
        "public/audio/properties",
        audioFilename
      );
      await writeFile(audioFilePath, audioBuffer);
      propertyData.audio = audioFilename;
    }

    const rateValidation = validateRatesPayload(propertyData.rates);
    if (!rateValidation.ok) {
      return new Response(rateValidation.error, { status: 400 });
    }
    propertyData.rates = rateValidation.rates;

    const newProperty = new Property(propertyData);
    await newProperty.save();

    await ensurePropertyAvailability(
      newProperty._id.toString(),
      newProperty.owner,
    );

    return Response.redirect(
      new URL(`/properties/${newProperty._id}`, request.url)
    );
  } catch (error) {
    console.error("Failed to add property", error);
    return new Response("Failed to add property", { status: 500 });
  }
};
