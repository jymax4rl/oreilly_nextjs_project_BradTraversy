import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { isOpsStaff } from "@/utils/opsAuth";
import connectToDatabase from "@/config/database";
import User from "@/models/User";

export async function PATCH(request, context) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isOpsStaff(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await context.params;
  await connectToDatabase();
  const body = await request.json();
  if (body.cleanerStatus !== "active" && body.cleanerStatus !== "suspended") {
    return Response.json({ error: "Invalid cleaner status" }, { status: 400 });
  }
  const user = await User.findById(id);
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });
  user.cleanerStatus = body.cleanerStatus;
  await user.save();
  return Response.json({ ok: true, cleanerStatus: user.cleanerStatus });
}
