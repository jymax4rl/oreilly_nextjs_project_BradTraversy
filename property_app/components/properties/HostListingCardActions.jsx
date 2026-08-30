"use client";

import Link from "next/link";
import { CalendarDays, DollarSign, Eye } from "lucide-react";
import DeletePropertyControl from "./DeletePropertyControl";

/** Host manage actions under a listing card on My listings. */
export default function HostListingCardActions({
  propertyId,
  propertyName,
  onDeleted,
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--kama-border)] pt-3">
      <Link
        href={`/properties/${propertyId}`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--kama-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--kama-ink)] transition hover:bg-[var(--kama-field)]"
      >
        <Eye className="h-3.5 w-3.5" aria-hidden />
        View
      </Link>
      <Link
        href={`/properties/${propertyId}/rates`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--kama-accent)]/30 bg-white px-3 py-1.5 text-xs font-medium text-[var(--kama-accent)] transition hover:bg-[var(--kama-accent-soft)]"
      >
        <DollarSign className="h-3.5 w-3.5" aria-hidden />
        Rates
      </Link>
      <Link
        href={`/properties/${propertyId}/calendar`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--kama-accent)]/30 bg-white px-3 py-1.5 text-xs font-medium text-[var(--kama-accent)] transition hover:bg-[var(--kama-accent-soft)]"
      >
        <CalendarDays className="h-3.5 w-3.5" aria-hidden />
        Calendar
      </Link>
      <DeletePropertyControl
        propertyId={propertyId}
        propertyName={propertyName}
        onDeleted={onDeleted}
      />
    </div>
  );
}
