import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin } from "lucide-react";
import { formatGuestDate, countNights } from "@/utils/availability/validateStay";
import BookingManageActions from "@/components/bookings/BookingManageActions";
import { propertyCardImageSrc } from "@/utils/cloudinary/propertyMediaUrls";

export default function BookingCard({ booking }) {
  const property = booking.property;
  const name = booking.propertyName || property?.name || "Property";
  const locationLabel = property?.location
    ? [property.location.city, property.location.country].filter(Boolean).join(", ")
    : null;
  const nights = countNights(booking.checkIn, booking.checkOut);
  const statusClass =
    booking.status === "confirmed"
      ? "bg-emerald-100 text-emerald-800"
      : booking.status === "pending"
        ? "bg-amber-100 text-amber-800"
        : "bg-slate-100 text-slate-600";

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <Link href={`/properties/${booking.propertyId}`} className="flex gap-4 p-4 sm:p-5">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-28 sm:w-32">
          <Image
            src={propertyCardImageSrc(property?.images)}
            alt=""
            fill
            sizes="128px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusClass}`}
            >
              {booking.status}
            </span>
            {booking.transactionId && (
              <span className="text-[10px] text-slate-400">
                Ref #{booking.transactionId}
              </span>
            )}
          </div>
          <h2 className="text-lg font-semibold text-slate-900">{name}</h2>
          {locationLabel && (
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
              <MapPin size={14} className="shrink-0" aria-hidden />
              {locationLabel}
            </p>
          )}
          <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-slate-700">
            <Calendar size={15} className="shrink-0 text-indigo-500" aria-hidden />
            {formatGuestDate(booking.checkIn)} – {formatGuestDate(booking.checkOut)}
            <span className="text-slate-400">
              ({nights} night{nights !== 1 ? "s" : ""})
            </span>
          </p>
          {booking.amount != null && booking.currency && (
            <p className="mt-2 text-sm font-semibold tabular-nums text-slate-900">
              {booking.currency} {Number(booking.amount).toLocaleString()}
            </p>
          )}
        </div>
      </Link>
      {booking.status === "confirmed" && (
        <BookingManageActions booking={booking} />
      )}
    </article>
  );
}
