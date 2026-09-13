import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { getVapidPublicKey } from "@/utils/push/webPush";

export const dynamic = "force-dynamic";

/** Public VAPID key for PushManager.subscribe — not a secret. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    return Response.json({ configured: false, publicKey: "" });
  }
  return Response.json({ configured: true, publicKey });
}
