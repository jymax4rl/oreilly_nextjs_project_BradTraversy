import connectToDatabase from "@/config/database";
import { serializePropertyForClient } from "@/utils/serializePropertyForClient";
import HostAvailabilityCalendar from "@/components/calendar/HostAvailabilityCalendar";
import HostPropertyBookings from "@/components/bookings/HostPropertyBookings";
import HostShell from "@/components/host/HostShell";
import HostPropertyToolChrome from "@/components/host/HostPropertyToolChrome";
import HostReservationManagerHint from "@/components/host/HostReservationManagerHint";
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
      ? `Calendar — ${property.name} | Isisel`
      : "Calendar | Isisel",
    robots: { index: false, follow: false },
  };
}

export default async function PropertyCalendarPage({ params }) {
  await connectToDatabase();
  const { id } = await params;
  const property = await findPropertyByParam(id, "-internalNotes");

  if (!property) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const calendarPath = `/properties/${id}/calendar`;

  if (!session) {
    redirect(
      `/api/auth/signin?callbackUrl=${encodeURIComponent(calendarPath)}`,
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
        eyebrowKey="hostConsole.availabilityCalendar"
        name={serialized.name}
        locationLabel={locationLabel}
        imageSrc={propertyImageUrl(serialized.images?.[0])}
      >
        <HostAvailabilityCalendar
          propertyId={serialized._id}
          baseRates={serialized.rates}
        />
        <HostReservationManagerHint href={`/properties/${id}/reservations`} />
        <HostPropertyBookings propertyId={serialized._id} />
      </HostPropertyToolChrome>
    </HostShell>
  );
}
