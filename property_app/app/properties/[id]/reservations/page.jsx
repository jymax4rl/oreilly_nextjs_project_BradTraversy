import connectToDatabase from "@/config/database";
import { serializePropertyForClient } from "@/utils/serializePropertyForClient";
import HostPropertyBookings from "@/components/bookings/HostPropertyBookings";
import HostShell from "@/components/host/HostShell";
import HostPropertyToolChrome from "@/components/host/HostPropertyToolChrome";
import { resolveBookingPolicy } from "@/utils/bookings/bookingPolicy";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { propertyCardImageSrc } from "@/utils/cloudinary/propertyMediaUrls";
import { findPropertyByParam } from "@/utils/listings/propertySlug";
import { propertyPublicPath } from "@/utils/listings/propertyPath";

export async function generateMetadata({ params }) {
  await connectToDatabase();
  const { id } = await params;
  const property = await findPropertyByParam(id, "name");
  return {
    title: property
      ? `Reservations — ${property.name} | Isisel`
      : "Reservations | Isisel",
    robots: { index: false, follow: false },
  };
}

export default async function PropertyReservationsPage({ params }) {
  await connectToDatabase();
  const { id } = await params;
  const property = await findPropertyByParam(id, "-internalNotes");

  if (!property) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const path = `/properties/${id}/reservations`;

  if (!session) {
    redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent(path)}`);
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

  const policy = resolveBookingPolicy(property);

  return (
    <HostShell>
      <HostPropertyToolChrome
        backHref="/host/reservations"
        backKey="hostConsole.allReservations"
        eyebrowKey="hostConsole.manageReservations"
        name={serialized.name}
        locationLabel={locationLabel}
        imageSrc={propertyCardImageSrc(serialized.images)}
        policyHours={policy}
        showListingTools
        calendarHref={`/properties/${id}/calendar`}
        ratesHref={`/properties/${id}/rates`}
      >
        <HostPropertyBookings propertyId={serialized._id} mode="property" />
      </HostPropertyToolChrome>
    </HostShell>
  );
}
