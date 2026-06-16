import connectToDatabase from "@/config/database";
import User from "@/models/User";
import HostApplication from "@/models/HostApplication";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { normalizeAddressInput } from "@/utils/address";

function parseApplicationBody(body) {
  const { phone, idType, idNumber, address, bio } = body;

  if (!phone?.trim() || !idType?.trim() || !idNumber?.trim()) {
    return { error: "Missing required fields" };
  }

  const normalizedAddress = normalizeAddressInput(address);
  if (!normalizedAddress) {
    return {
      error:
        "A complete address is required (street, city, and country).",
    };
  }

  return {
    data: {
      phone: phone.trim(),
      idType: idType.trim(),
      idNumber: idNumber.trim(),
      address: normalizedAddress,
      bio: bio?.trim() || "",
    },
  };
}

async function syncUserHostAddress(user, address) {
  user.hostAddress = address;
  await user.save();
}

// GET — return the caller's own application (used to pre-populate the edit form)
export const GET = async () => {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    if (!session?.user) return new Response("Unauthorized", { status: 401 });

    const user = await User.findOne({ email: session.user.email });
    if (!user) return new Response("User not found", { status: 404 });

    const application = await HostApplication.findOne({ user: user._id }).lean();
    if (!application) return new Response("No application found", { status: 404 });

    return Response.json({ application });
  } catch (error) {
    console.error("GET onboarding error:", error);
    return new Response("Failed to fetch application", { status: 500 });
  }
};

// POST — submit a brand-new application
export const POST = async (request) => {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    if (!session?.user) return new Response("Unauthorized", { status: 401 });

    const body = await request.json();
    const parsed = parseApplicationBody(body);
    if (parsed.error) {
      return new Response(parsed.error, { status: 400 });
    }

    const { phone, idType, idNumber, address, bio } = parsed.data;

    const user = await User.findOne({ email: session.user.email });
    if (!user) return new Response("User not found", { status: 404 });

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
    await syncUserHostAddress(user, address);

    return Response.json({
      success: true,
      message: "Application submitted for review",
    });
  } catch (error) {
    console.error("Onboarding POST error:", error);
    return new Response("Failed to submit application", { status: 500 });
  }
};

// PUT — resubmit a rejected application (resets it back to pending for re-review)
export const PUT = async (request) => {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    if (!session?.user) return new Response("Unauthorized", { status: 401 });

    const body = await request.json();
    const parsed = parseApplicationBody(body);
    if (parsed.error) {
      return new Response(parsed.error, { status: 400 });
    }

    const { phone, idType, idNumber, address, bio } = parsed.data;

    const user = await User.findOne({ email: session.user.email });
    if (!user) return new Response("User not found", { status: 404 });

    if (user.hostStatus !== "rejected") {
      return new Response("Only rejected applicants can resubmit", { status: 400 });
    }

    const application = await HostApplication.findOne({ user: user._id });
    if (!application) return new Response("Application not found", { status: 404 });

    application.phone = phone;
    application.idType = idType;
    application.idNumber = idNumber;
    application.address = address;
    application.bio = bio;
    application.status = "pending";
    application.rejectionReason = undefined;
    application.reviewedAt = undefined;
    application.reviewedBy = undefined;
    await application.save();

    user.hostStatus = "onboarding";
    await syncUserHostAddress(user, address);

    return Response.json({
      success: true,
      message: "Application resubmitted for review",
    });
  } catch (error) {
    console.error("Onboarding PUT error:", error);
    return new Response("Failed to resubmit application", { status: 500 });
  }
};
