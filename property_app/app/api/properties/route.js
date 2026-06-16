import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import { ensurePropertyAvailability } from "@/utils/availability/availabilityService";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { computeListingPrice } from "@/utils/listingPricing";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
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

    const formData = await request.formData();
    const amenities = formData.getAll("amenities");
    const images = formData
      .getAll("images")
      .filter((image) => image.name !== "");

    const rates = {
      nightly: num(formData.get("rates.nightly")),
      weekly: num(formData.get("rates.weekly")),
      monthly: num(formData.get("rates.monthly")),
      weekendPremium: num(formData.get("rates.weekendPremium")) || 0,
    };

    const lat = num(formData.get("location.lat"));
    const lng = num(formData.get("location.lng"));

    const propertyData = {
      type: formData.get("type"),
      name: formData.get("name"),
      description: formData.get("description"),
      location: {
        street: formData.get("location.street"),
        streetLine2: formData.get("location.streetLine2") || undefined,
        city: formData.get("location.city"),
        state: formData.get("location.state") || undefined,
        zipcode: formData.get("location.zipcode") || undefined,
        country: formData.get("location.country") || undefined,
        formatted: formData.get("location.formatted") || undefined,
        placeId: formData.get("location.placeId") || undefined,
        lat,
        lng,
        showExactLocation:
          formData.get("location.showExactLocation") === "true",
      },
      listing: {
        privacyType: formData.get("listing.privacyType") || "entire_place",
        maxGuests: num(formData.get("listing.maxGuests")) || 2,
        bedroomHasLock: formData.get("listing.bedroomHasLock") === "true",
      },
      beds: num(formData.get("beds")),
      baths: num(formData.get("baths")),
      square_feet: num(formData.get("square_feet")) || 500,
      amenities,
      rates,
      listingPrice: computeListingPrice(rates),
      seller_info: {
        name: formData.get("seller_info.name"),
        email: formData.get("seller_info.email"),
        phone: formData.get("seller_info.phone"),
      },
      owner: session.user.id,
    };

    const imageDir = path.join(process.cwd(), "public/images/properties");
    await mkdir(imageDir, { recursive: true });

    const imageUrls = [];
    for (const image of images) {
      const byteData = await image.arrayBuffer();
      const buffer = Buffer.from(byteData);
      const filename = Date.now() + "_" + image.name.replace(/\s/g, "_");
      const filePath = path.join(imageDir, filename);
      await writeFile(filePath, buffer);
      imageUrls.push(filename);
    }

    propertyData.images = imageUrls;

    const audioFile = formData.get("audio");
    if (audioFile && audioFile.size > 0 && audioFile.name !== "undefined") {
      const audioDir = path.join(process.cwd(), "public/audio/properties");
      await mkdir(audioDir, { recursive: true });
      const audioByteData = await audioFile.arrayBuffer();
      const audioBuffer = Buffer.from(audioByteData);
      const audioFilename =
        Date.now() + "_" + audioFile.name.replace(/\s/g, "_");
      await writeFile(path.join(audioDir, audioFilename), audioBuffer);
      propertyData.audio = audioFilename;
    }

    const newProperty = new Property(propertyData);
    await newProperty.save();

    await ensurePropertyAvailability(newProperty._id.toString());

    return Response.redirect(
      new URL(`/properties/${newProperty._id}`, request.url),
    );
  } catch (error) {
    console.error("Failed to add property", error);
    return new Response("Failed to add property", { status: 500 });
  }
};
