import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import { redirect } from "next/navigation";
import HostListingsView from "@/components/host/HostListingsView";
import { isAwaitingListingModeration } from "@/utils/listingApproval";
import User from "@/models/User";
import { serializeFoundingHostPublic } from "@/utils/foundingHost/serialize";

export const metadata = {
  title: "My Listings | Isisel",
  description: "Manage your property listings on Isisel",
  robots: { index: false, follow: false },
};

function listingDisplayStatus(property) {
  if (property.status === "rejected") return "rejected";
  if (isAwaitingListingModeration(property)) return "pending";
  return "approved";
}

export default async function HostListingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.hostStatus !== "verified") {
    redirect("/host/onboarding");
  }

  await connectToDatabase();

  const properties = await Property.find({ owner: session.user.id })
    .sort({ createdAt: -1 })
    .lean();

  const serialized = properties.map((p) => ({
    ...p,
    _id: p._id.toString(),
    owner: p.owner?.toString?.() || p.owner,
    displayStatus: listingDisplayStatus(p),
  }));

  const total = serialized.length;
  const approved = serialized.filter(
    (p) => p.displayStatus === "approved",
  ).length;
  const pending = serialized.filter(
    (p) => p.displayStatus === "pending",
  ).length;

  const hostUser = await User.findById(session.user.id)
    .select("foundingHost")
    .lean();

  return (
    <HostListingsView
      properties={serialized}
      total={total}
      approved={approved}
      pending={pending}
      foundingHost={serializeFoundingHostPublic(hostUser)}
    />
  );
}
