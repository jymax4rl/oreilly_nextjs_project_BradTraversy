import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import { serializePropertyForClient } from "@/utils/serializePropertyForClient";
import PropertyContactForm from "@/components/PropertyContactForm";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import { ArrowLeft, MapPin } from "lucide-react";
import { propertyPrimaryImageSrc } from "@/utils/cloudinary/propertyMediaUrls";

export async function generateMetadata({ params }) {
  await connectToDatabase();
  const { id } = await params;
  const property = await Property.findById(id).select("name seller_info").lean();

  if (!property) {
    return { title: "Message | Kama Properties" };
  }

  const owner = property.seller_info?.name || "host";
  return {
    title: `Message ${owner} | ${property.name}`,
    robots: { index: false, follow: false },
  };
}

export default async function PropertyMessagePage({ params }) {
  await connectToDatabase();
  const { id } = await params;
  const property = await Property.findById(id, "-internalNotes").lean();

  if (!property) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const messagePath = `/properties/${id}/message`;

  if (!session) {
    redirect(
      `/api/auth/signin?callbackUrl=${encodeURIComponent(messagePath)}`,
    );
  }

  const serialized = serializePropertyForClient(property);
  const ownerName = serialized.seller_info?.name || "the host";

  if (session.user.id === serialized.owner) {
    redirect(`/properties/${id}`);
  }

  if (!serialized.owner) {
    notFound();
  }

  const locationLabel = [
    serialized.location?.city,
    serialized.location?.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-h-screen bg-slate-50 pb-24 pt-14 font-sans text-slate-900 md:pt-20">
      <div className="mx-auto max-w-lg px-4 py-6 sm:py-8">
        <Link
          href={`/properties/${id}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          <ArrowLeft size={18} aria-hidden />
          Back to listing
        </Link>

        <div className="mb-6 flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
            <Image
              src={propertyPrimaryImageSrc(serialized.images)}
              alt=""
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Messaging
            </p>
            <h1 className="mt-0.5 text-lg font-semibold leading-snug text-slate-900">
              Message {ownerName}
            </h1>
            <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-700">
              {serialized.name}
            </p>
            {locationLabel && (
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                <MapPin size={12} className="shrink-0" aria-hidden />
                {locationLabel}
              </p>
            )}
          </div>
        </div>

        <PropertyContactForm
          propertyId={serialized._id}
          recipientId={serialized.owner}
          propertyName={serialized.name}
          ownerName={ownerName}
          defaultName={session.user.name || ""}
          defaultEmail={session.user.email || ""}
        />
      </div>
    </div>
  );
}
