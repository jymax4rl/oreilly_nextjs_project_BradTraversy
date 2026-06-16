import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";
import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, PlusCircle, MapPin, BedDouble, Bath, Eye, Clock, CheckCircle, XCircle } from "lucide-react";

export const metadata = {
  title: "My Listings | Kama Properties",
  description: "Manage your property listings on Kama Properties",
};

const statusConfig = {
  approved: {
    label: "Approved",
    className: "bg-green-100 text-green-800",
    Icon: CheckCircle,
  },
  pending: {
    label: "Pending Review",
    className: "bg-yellow-100 text-yellow-800",
    Icon: Clock,
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-800",
    Icon: XCircle,
  },
};

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
  }));

  const total = serialized.length;
  const approved = serialized.filter((p) => p.status === "approved").length;
  const pending = serialized.filter(
    (p) => !p.status || p.status === "pending"
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 pt-[7.75rem] pb-24 lg:pt-[10vh] lg:pb-12">
      <div className="container mx-auto max-w-5xl px-4">

        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
            <p className="mt-1 text-sm text-gray-500">
              {total} listing{total !== 1 ? "s" : ""} · {approved} approved · {pending} pending review
            </p>
          </div>
          <Link
            href="/properties/add"
            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition"
          >
            <PlusCircle className="h-4 w-4" />
            Add New Listing
          </Link>
        </div>

        {/* Empty state */}
        {serialized.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
            <Building2 className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              No listings yet
            </h2>
            <p className="text-gray-500 max-w-sm mx-auto mb-6">
              Start earning by listing your first property on Kama Properties.
            </p>
            <Link
              href="/properties/add"
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition"
            >
              <PlusCircle className="h-4 w-4" />
              List a Property
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {serialized.map((property) => {
              const status = property.status || "pending";
              const cfg = statusConfig[status] || statusConfig.pending;
              const StatusIcon = cfg.Icon;
              const image = property.images?.[0];

              return (
                <div
                  key={property._id}
                  className="flex flex-col sm:flex-row gap-4 rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition"
                >
                  {/* Thumbnail */}
                  <div className="shrink-0 w-full sm:w-32 h-40 sm:h-28 rounded-xl overflow-hidden bg-gray-100">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/images/properties/${image}`}
                        alt={property.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <h3 className="font-bold text-gray-900 text-base leading-tight">
                          {property.name}
                        </h3>
                        {(property.location?.city || property.location?.country) && (
                          <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            {[property.location.city, property.location.country]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        )}
                      </div>

                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.className}`}>
                        <StatusIcon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span className="capitalize">{property.type}</span>
                      <span className="flex items-center gap-1">
                        <BedDouble className="h-3.5 w-3.5" /> {property.beds} bed{property.beds !== 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bath className="h-3.5 w-3.5" /> {property.baths} bath{property.baths !== 1 ? "s" : ""}
                      </span>
                      {property.rates?.nightly && (
                        <span className="font-semibold text-gray-900">
                          ${property.rates.nightly} / night
                        </span>
                      )}
                    </div>

                    {property.status === "rejected" && property.rejectionReason && (
                      <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                        <span className="font-medium">Rejection reason:</span> {property.rejectionReason}
                      </div>
                    )}

                    <div className="mt-3 flex gap-2 flex-wrap">
                      <Link
                        href={`/properties/${property._id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View Listing
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
