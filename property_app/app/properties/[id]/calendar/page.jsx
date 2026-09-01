import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import { serializePropertyForClient } from "@/utils/serializePropertyForClient";
import HostAvailabilityCalendar from "@/components/calendar/HostAvailabilityCalendar";
import HostPropertyBookings from "@/components/bookings/HostPropertyBookings";
import HostShell from "@/components/host/HostShell";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { ArrowLeft, MapPin } from "lucide-react";

export async function generateMetadata({ params }) {
  await connectToDatabase();
  const { id } = await params;
  const property = await Property.findById(id).select("name").lean();
  return {
    title: property
      ? `Calendar — ${property.name} | Kama Properties`
      : "Calendar | Kama Properties",
    robots: { index: false, follow: false },
  };
}

function propertyImageSrc(filename) {
  return `/properties/${filename || "default.jpg"}`;
}

export default async function PropertyCalendarPage({ params }) {
  await connectToDatabase();
  const { id } = await params;
  const property = await Property.findById(id, "-internalNotes").lean();

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
    redirect(`/properties/${id}`);
  }

  const locationLabel = [
    serialized.location?.city,
    serialized.location?.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <HostShell>
      <div className="mx-auto max-w-2xl">
        <Link
          href="/host/listings"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--kama-ink-muted)] transition hover:text-[var(--kama-ink)]"
        >
          <ArrowLeft size={18} aria-hidden />
          Listings
        </Link>

        <div className="mb-6 flex gap-4 rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-4 shadow-sm">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[var(--kama-field)]">
            <Image
              src={propertyImageSrc(serialized.images?.[0])}
              alt=""
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--kama-accent)]">
              Availability calendar
            </p>
            <h1 className="mt-0.5 text-lg font-semibold leading-snug text-[var(--kama-ink)]">
              {serialized.name}
            </h1>
            {locationLabel && (
              <p className="mt-1 flex items-center gap-1 text-xs text-[var(--kama-ink-muted)]">
                <MapPin size={12} className="shrink-0" aria-hidden />
                {locationLabel}
              </p>
            )}
          </div>
        </div>

        <HostAvailabilityCalendar
          propertyId={serialized._id}
          baseRates={serialized.rates}
        />

        <div className="mt-6 rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-4 py-3 text-sm text-[var(--kama-ink-muted)]">
          <Link
            href={`/properties/${id}/reservations`}
            className="font-semibold text-[var(--kama-accent)] hover:underline"
          >
            Open full reservation manager
          </Link>
          <span> — resend, modify, or cancel bookings</span>
        </div>

        <HostPropertyBookings propertyId={serialized._id} />
      </div>
    </HostShell>
  );
}
