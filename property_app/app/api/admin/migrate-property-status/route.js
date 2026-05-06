import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import { getSessionFromRequest } from "@/utils/authSessionRoute";

export const dynamic = "force-dynamic";

export const POST = async (request) => {
  try {
    await connectToDatabase();
    const session = await getSessionFromRequest(request);

    if (!session?.user || session.user.role !== "admin") {
      return new Response("Unauthorized - Admin access required", {
        status: 403,
      });
    }

    const result = await Property.updateMany(
      { status: { $exists: false } },
      { $set: { status: "approved" } },
    );

    return Response.json(
      {
        success: true,
        matchedCount: result.matchedCount ?? 0,
        modifiedCount: result.modifiedCount ?? 0,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Property status migration failed:", error);
    return new Response(`Migration failed: ${error.message}`, { status: 500 });
  }
};
