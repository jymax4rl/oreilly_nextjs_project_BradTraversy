import connectToDatabase from "@/config/database";
import CreatorPartner from "@/models/CreatorPartner";
import CreatorPromoCode from "@/models/CreatorPromoCode";
import Property from "@/models/Property";
import CreatorJoinView from "@/components/creators/CreatorJoinView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Join creator console | Isisel",
  robots: { index: false, follow: false },
};

export default async function CreatorJoinPage({ params }) {
  const { token } = await params;
  await connectToDatabase();

  const partner = await CreatorPartner.findOne({
    portalToken: String(token || "").trim(),
    status: { $ne: "archived" },
  })
    .select("name platform status")
    .lean();

  if (!partner) {
    return (
      <main className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-xl font-semibold text-[var(--kama-ink)]">
          Invite not found
        </h1>
        <p className="mt-2 text-sm text-[var(--kama-ink-muted)]">
          Ask your host for a fresh creator invite link.
        </p>
      </main>
    );
  }

  const codes = await CreatorPromoCode.find({
    creatorPartnerId: partner._id,
  })
    .select("code propertyId status")
    .lean();

  const propertyIds = codes.map((c) => c.propertyId).filter(Boolean);
  const properties = propertyIds.length
    ? await Property.find({ _id: { $in: propertyIds } })
        .select("name")
        .lean()
    : [];
  const nameById = new Map(
    properties.map((p) => [String(p._id), p.name || "Listing"]),
  );

  return (
    <CreatorJoinView
      token={token}
      preview={{
        name: partner.name,
        platform: partner.platform || "",
        codes: codes.map((c) => ({
          code: c.code,
          status: c.status,
          propertyName: nameById.get(String(c.propertyId)) || "Listing",
        })),
      }}
    />
  );
}
