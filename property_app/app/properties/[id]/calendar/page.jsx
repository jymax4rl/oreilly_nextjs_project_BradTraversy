import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import { serializePropertyForClient } from "@/utils/serializePropertyForClient";
import HostAvailabilityCalendar from "@/components/calendar/HostAvailabilityCalendar";
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
    <div className="min-h-screen bg-slate-50 pb-24 pt-14 font-sans text-slate-900 md:pt-20">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
        <Link
          href="/properties/my-listings"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          <ArrowLeft size={18} aria-hidden />
          My listings
        </Link>

        <div className="mb-6 flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
            <Image
              src={propertyImageSrc(serialized.images?.[0])}
              alt=""
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Availability calendar
            </p>
            <h1 className="mt-0.5 text-lg font-semibold leading-snug text-slate-900">
              {serialized.name}
            </h1>
            {locationLabel && (
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
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
      </div>
    </div>
  );
}
