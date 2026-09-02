import connectToDatabase from "@/config/database";
import HostRatesForm from "@/components/rates/HostRatesForm";
import HostShell from "@/components/host/HostShell";
import { serializePropertyForClient } from "@/utils/serializePropertyForClient";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { ArrowLeft, MapPin } from "lucide-react";
import { findPropertyByParam } from "@/utils/listings/propertySlug";
import { propertyPublicPath } from "@/utils/listings/propertyPath";

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

function propertyImageSrc(filename) {
  return `/properties/${filename || "default.jpg"}`;
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
    <div className="mx-auto max-w-2xl">
        <Link
          href="/host/listings"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--kama-ink-muted)] transition hover:text-[var(--kama-ink)]"
        >
          <ArrowLeft size={18} aria-hidden />
          Listings
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
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Pricing
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

        <HostRatesForm
          propertyId={serialized._id}
          propertyName={serialized.name}
        />
    </div>
    </HostShell>
  );
}
