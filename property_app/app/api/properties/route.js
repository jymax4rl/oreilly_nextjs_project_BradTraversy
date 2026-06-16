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
import { uploadPropertyImage } from "@/utils/cloudinary/uploadPropertyMedia";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { computeListingPrice } from "@/utils/listingPricing";
import { uploadPropertyImages } from "@/utils/uploadPropertyImages";

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function str(value) {
  return typeof value === "string" ? value.trim() : "";
}

export const POST = async (request) => {
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

    const formData = await request.formData();
    const amenities = formData.getAll("amenities");
    const imageFiles = formData
      .getAll("images")
      .filter((image) => image?.name && image.size > 0);

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

    const lat = num(formData.get("location.lat"));
    const lng = num(formData.get("location.lng"));
    const hostId = String(session.user.id);

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
    };

    const newProperty = new Property(propertyData);
    await newProperty.save();

    const propertyId = newProperty._id.toString();
    let images = [];

    if (isCloudinaryConfigured()) {
      const imageEntries = [];
      for (const image of imageFiles) {
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

    newProperty.images = images;

    try {
      await ensurePropertyAvailability(newProperty._id.toString());
    } catch (availabilityError) {
      console.error("Availability init warning:", availabilityError);
    }

    return Response.json({
      success: true,
      id: newProperty._id.toString(),
      redirectUrl: `/properties/${newProperty._id}`,
    });
  } catch (error) {
    console.error("Failed to add property", error);
    const message =
      error?.message || "Failed to add property. Please try again.";
    return Response.json({ error: message }, { status: 500 });
  }
};
