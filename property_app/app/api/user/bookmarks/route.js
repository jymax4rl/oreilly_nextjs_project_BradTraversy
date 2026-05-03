import connectToDatabase from "@/config/database";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import mongoose from "mongoose";

// GET - Fetch user's saved properties with full property data
export const GET = async () => {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email })
      .populate("bookmarks")
      .lean();

    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    const savedProperties = (user.bookmarks || []).map((property) => ({
      ...property,
      _id: property._id.toString(),
      owner: property.owner?.toString?.() || property.owner,
    }));

    return Response.json({ properties: savedProperties });
  } catch (error) {
    console.error("GET bookmarks error:", error);
    return new Response("Failed to fetch saved properties", { status: 500 });
  }
};

// PATCH - Toggle a property in bookmarks (save or unsave)
export const PATCH = async (request) => {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { propertyId } = await request.json();

    if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
      return new Response("Invalid property ID", { status: 400 });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    const objectId = new mongoose.Types.ObjectId(propertyId);
    const isBookmarked = user.bookmarks.some(
      (id) => id.toString() === propertyId,
    );

    if (isBookmarked) {
      user.bookmarks = user.bookmarks.filter(
        (id) => id.toString() !== propertyId,
      );
    } else {
      user.bookmarks.push(objectId);
    }

    await user.save();

    return Response.json({
      success: true,
      isBookmarked: !isBookmarked,
      message: isBookmarked ? "Removed from saved" : "Added to saved",
    });
  } catch (error) {
    console.error("PATCH bookmarks error:", error);
    return new Response("Failed to update bookmarks", { status: 500 });
  }
};
