import connectToDatabase from "@/config/database";
import User from "@/models/User";
import HostApplication from "@/models/HostApplication";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";

export const POST = async (request) => {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { phone, idType, idNumber, address, bio } = body;

    if (!phone || !idType || !idNumber || !address) {
      return new Response("Missing required fields", { status: 400 });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    if (user.hostStatus === "verified") {
      return new Response("Already a verified host", { status: 400 });
    }

    const existing = await HostApplication.findOne({ user: user._id });
    if (existing) {
      return new Response("Application already submitted", { status: 409 });
    }

    await HostApplication.create({
      user: user._id,
      phone,
      idType,
      idNumber,
      address,
      bio,
    });

    user.hostStatus = "onboarding";
    await user.save();

    return Response.json({
      success: true,
      message: "Application submitted for review",
    });
  } catch (error) {
    console.error("Onboarding error:", error);
    return new Response("Failed to submit application", { status: 500 });
  }
};
