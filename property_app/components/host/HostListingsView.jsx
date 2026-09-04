"use client";

import Link from "next/link";
import {
  Building2,
  PlusCircle,
  MapPin,
  BedDouble,
  Bath,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  CalendarPlus,
} from "lucide-react";
import { useState } from "react";
import DeletePropertyControl from "@/components/properties/DeletePropertyControl";
import PropertyListingThumbnail from "@/components/properties/PropertyListingThumbnail";
import HostCreateReservationModal from "@/components/host/HostCreateReservationModal";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { propertyTypeMessageKey } from "@/lib/i18n/messages";
import { propertyImageUrl } from "@/utils/propertyImageUrl";
import { propertyPublicPath } from "@/utils/listings/propertyPath";

const STATUS_ICONS = {
  approved: CheckCircle,
  pending: Clock,
  rejected: XCircle,
};

const STATUS_CLASS = {
  approved: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  rejected: "bg-red-100 text-red-800",
};

const STATUS_KEY = {
  approved: "hostConsole.approved",
  pending: "hostConsole.pendingReview",
  rejected: "hostConsole.rejected",
};

export default function HostListingsView({
  properties,
  total,
  approved,
  pending,
}) {
  const { t } = useLanguage();
  const [createFor, setCreateFor] = useState(null);
  const summaryKey =
    total === 1
      ? "hostConsole.listingsSummaryOne"
      : "hostConsole.listingsSummary";

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--kama-ink)]">
            {t("hostConsole.listingsTitle")}
          </h1>
          <p className="mt-1 text-sm text-[var(--kama-ink-muted)]">
            {t(summaryKey, { total, approved, pending })}
          </p>
        </div>
        <Link
          href="/properties/add"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--kama-accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--kama-accent-hover)]"
        >
          <PlusCircle className="h-4 w-4" />
          {t("hostConsole.listStay")}
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
          <Building2 className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h2 className="mb-2 text-xl font-bold text-gray-900">
            {t("hostConsole.emptyTitle")}
          </h2>
          <p className="mx-auto mb-6 max-w-sm text-gray-500">
            {t("hostConsole.emptyHint")}
          </p>
          <Link
            href="/properties/add"
            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            <PlusCircle className="h-4 w-4" />
            {t("hostConsole.listProperty")}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {properties.map((property) => {
            const status = property.displayStatus;
            const StatusIcon = STATUS_ICONS[status] || Clock;
            const image = property.images?.[0];

            return (
              <div
                key={property._id}
                className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 transition hover:shadow-md sm:flex-row"
              >
                <div className="h-40 w-full shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-28 sm:w-32">
                  <PropertyListingThumbnail
                    src={image ? propertyImageUrl(image) : null}
                    alt={property.name}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold leading-tight text-gray-900">
                        {property.name}
                      </h3>
                      {(property.location?.city ||
                        property.location?.country) && (
                        <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          {[property.location.city, property.location.country]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASS[status] || STATUS_CLASS.pending}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {t(STATUS_KEY[status] || STATUS_KEY.pending)}
                    </span>
                    {property.listed === false ? (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        Hidden from site
                      </span>
                    ) : null}
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                    <span className="capitalize">
                      {t(propertyTypeMessageKey(property.type))}
                    </span>
                    <span className="flex items-center gap-1">
                      <BedDouble className="h-3.5 w-3.5" />{" "}
                      {t(
                        property.beds === 1
                          ? "hostConsole.bedOne"
                          : "hostConsole.bedOther",
                        { n: property.beds },
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath className="h-3.5 w-3.5" />{" "}
                      {t(
                        property.baths === 1
                          ? "hostConsole.bathOne"
                          : "hostConsole.bathOther",
                        { n: property.baths },
                      )}
                    </span>
                    {property.rates?.nightly ? (
                      <span className="font-semibold text-gray-900">
                        ${property.rates.nightly} {t("hostConsole.perNight")}
                      </span>
                    ) : null}
                  </div>

                  {property.status === "rejected" &&
                    property.rejectionReason && (
                      <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                        <span className="font-medium">
                          {t("hostConsole.rejectionReason")}
                        </span>{" "}
                        {property.rejectionReason}
                      </div>
                    )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={propertyPublicPath(property)}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {t("hostConsole.viewListing")}
                    </Link>
                    {status !== "rejected" ? (
                      <button
                        type="button"
                        onClick={() => setCreateFor(property)}
                        className="inline-flex items-center gap-1 rounded-lg bg-[var(--kama-accent)] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--kama-accent-hover)]"
                      >
                        <CalendarPlus className="h-3.5 w-3.5" />
                        {t("hostConsole.createReservation.button")}
                      </button>
                    ) : null}
                    <Link
                      href={`/properties/${property._id}/rates`}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#1b5c57]/30 px-3 py-1.5 text-xs font-medium text-[#1b5c57] transition hover:bg-[#ecfdf5]"
                    >
                      {t("hostConsole.rates")}
                    </Link>
                    <Link
                      href={`/properties/${property._id}/calendar`}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#1b5c57]/30 px-3 py-1.5 text-xs font-medium text-[#1b5c57] transition hover:bg-[#ecfdf5]"
                    >
                      {t("hostConsole.calendar")}
                    </Link>
                    <DeletePropertyControl
                      propertyId={property._id}
                      propertyName={property.name}
                      redirectTo="/host/listings"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <HostCreateReservationModal
        open={Boolean(createFor)}
        property={createFor}
        onClose={() => setCreateFor(null)}
      />
    </div>
  );
}
