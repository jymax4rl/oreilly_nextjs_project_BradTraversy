import connectToDatabase from "@/config/database";
import HostRatesForm from "@/components/rates/HostRatesForm";
import HostShell from "@/components/host/HostShell";
import HostPropertyToolChrome from "@/components/host/HostPropertyToolChrome";
import { serializePropertyForClient } from "@/utils/serializePropertyForClient";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { findPropertyByParam } from "@/utils/listings/propertySlug";
import { propertyPublicPath } from "@/utils/listings/propertyPath";
import { propertyImageUrl } from "@/utils/propertyImageUrl";

export async function generateMetadata({ params }) {
  await connectToDatabase();
  const { id } = await params;
  const property = await findPropertyByParam(id, "name");
  return {
    title: property
      ? `Rates — ${property.name} | Isisel`
      : "Rates | Isisel",
    robots: { index: false, follow: false },
  };
}

export default async function PropertyRatesPage({ params }) {
  await connectToDatabase();
  const { id } = await params;
  const property = await findPropertyByParam(id, "-internalNotes");

  if (!property) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const ratesPath = `/properties/${id}/rates`;

  if (!session) {
    redirect(
      `/api/auth/signin?callbackUrl=${encodeURIComponent(ratesPath)}`,
    );
  }

  if (session.user.hostStatus !== "verified") {
    redirect("/host/onboarding");
  }

  const serialized = serializePropertyForClient(property);

  if (session.user.id !== serialized.owner) {
    redirect(propertyPublicPath(serialized));
  }

  const locationLabel = [
    serialized.location?.city,
    serialized.location?.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <HostShell>
      <HostPropertyToolChrome
        backHref="/host/listings"
        backKey="hostConsole.backListings"
        eyebrowKey="hostConsole.pricing"
        name={serialized.name}
        locationLabel={locationLabel}
        imageSrc={propertyImageUrl(serialized.images?.[0])}
      >
        <HostRatesForm
          propertyId={serialized._id}
          propertyName={serialized.name}
        />
      </HostPropertyToolChrome>
    </HostShell>
  );
}
