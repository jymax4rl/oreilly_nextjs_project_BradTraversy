"use client";

import React from "react";
import Image from "next/image";
import { Bed, Bath, Maximize, Mail, Phone, X, Clock } from "lucide-react";
import { useCurrency } from "@/utils/CurrencyContext";
import { formatCurrency } from "@/utils/currencyUtils";
import { propertyAudioUrl } from "@/utils/propertyImageUrl";
import AmenitiesAccordion from "@/components/AmenitiesAccordion";
import MessageOwnerButton from "@/components/MessageOwnerButton";
import {
  DEFAULT_CHECK_IN_TIME,
  DEFAULT_CHECK_OUT_TIME,
  formatClockTimeLabel,
} from "@/utils/checkInOutTimes";

function RateRow({ label, amount, currencyCode, rates, available }) {
  const symbol = currencyCode === "USD" ? "$" : currencyCode;

  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-[var(--kama-border)] bg-[var(--kama-field)] px-4 py-3.5 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
      <span className="shrink-0 text-sm font-medium text-[var(--kama-ink-muted)] sm:text-lg sm:font-light">
        {label}
      </span>
      {available ? (
        <span className="min-w-0 break-words text-right text-sm font-semibold tabular-nums text-[var(--kama-ink)] sm:text-lg">
          {formatCurrency(amount, rates[currencyCode], symbol)}
        </span>
      ) : (
        <span className="flex shrink-0 items-center gap-1.5 text-sm text-[var(--kama-danger,#b42318)]">
          Unavailable <X size={14} strokeWidth={3} aria-hidden />
        </span>
      )}
    </div>
  );
}

function formatSqFt(value) {
  if (value == null || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n) || n < 50 || n > 200_000) return "—";
  return Math.round(n).toLocaleString();
}

function PropertyDetails({ data }) {
  const { currencyCode, rates } = useCurrency();
  const ownerName =
    data.host?.name || data.seller_info?.name || "host";
  const ownerImage = data.host?.image || null;
  const propertyRates = data.rates || {};
  const sqftLabel = formatSqFt(data.square_feet);
  const checkInLabel = formatClockTimeLabel(
    data.checkInTime,
    DEFAULT_CHECK_IN_TIME,
  );
  const checkOutLabel = formatClockTimeLabel(
    data.checkOutTime,
    DEFAULT_CHECK_OUT_TIME,
  );

  return (
    <div className="min-w-0 space-y-8 sm:space-y-10 lg:col-span-2">
      <div className="grid grid-cols-3 gap-3 border-y border-[var(--kama-border)] py-5 sm:flex sm:gap-10 sm:py-6">
        <div className="flex min-w-0 flex-col items-center gap-1.5 text-center sm:flex-row sm:items-center sm:gap-3 sm:text-left">
          <Bed
            className="text-[var(--kama-accent)]"
            size={22}
            strokeWidth={1.5}
            aria-hidden
          />
          <span className="text-sm font-semibold text-[var(--kama-ink)] sm:text-lg">
            {data.beds ?? "—"}
            <span className="block text-xs font-normal text-[var(--kama-ink-muted)] sm:ml-1.5 sm:inline sm:text-base">
              Beds
            </span>
          </span>
        </div>
        <div className="flex min-w-0 flex-col items-center gap-1.5 border-x border-[var(--kama-border)] text-center sm:flex-row sm:items-center sm:gap-3 sm:border-0 sm:text-left">
          <Bath
            className="text-[var(--kama-accent)]"
            size={22}
            strokeWidth={1.5}
            aria-hidden
          />
          <span className="text-sm font-semibold text-[var(--kama-ink)] sm:text-lg">
            {data.baths ?? "—"}
            <span className="block text-xs font-normal text-[var(--kama-ink-muted)] sm:ml-1.5 sm:inline sm:text-base">
              Baths
            </span>
          </span>
        </div>
        <div className="flex min-w-0 flex-col items-center gap-1.5 text-center sm:flex-row sm:items-center sm:gap-3 sm:text-left">
          <Maximize
            className="text-[var(--kama-accent)]"
            size={22}
            strokeWidth={1.5}
            aria-hidden
          />
          <span className="text-sm font-semibold text-[var(--kama-ink)] sm:text-lg">
            {sqftLabel}
            <span className="block text-xs font-normal text-[var(--kama-ink-muted)] sm:ml-1.5 sm:inline sm:text-base">
              sqft
            </span>
          </span>
        </div>
      </div>

      <section className="hidden min-w-0 lg:block">
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-[var(--kama-ink)] sm:mb-6 sm:text-2xl">
          Rates per period
        </h2>
        <div className="flex flex-col gap-3 sm:gap-4">
          <RateRow
            label="Monthly"
            amount={propertyRates.monthly}
            currencyCode={currencyCode}
            rates={rates}
            available={Boolean(propertyRates.monthly)}
          />
          <RateRow
            label="Weekly"
            amount={propertyRates.weekly}
            currencyCode={currencyCode}
            rates={rates}
            available={Boolean(propertyRates.weekly)}
          />
          <RateRow
            label="Nightly"
            amount={propertyRates.nightly}
            currencyCode={currencyCode}
            rates={rates}
            available={Boolean(propertyRates.nightly)}
          />
        </div>
      </section>

      <section className="min-w-0">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-[var(--kama-ink)] sm:mb-4 sm:text-2xl">
          About this space
        </h2>
        <p className="text-base leading-relaxed text-[var(--kama-ink-muted)] sm:text-lg">
          {data.description}
        </p>
      </section>

      <section className="min-w-0">
        <h2 className="mb-3 text-xl font-semibold tracking-tight text-[var(--kama-ink)] sm:mb-4 sm:text-2xl">
          Check-in &amp; check-out
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-field)] px-4 py-4">
            <Clock
              className="mt-0.5 shrink-0 text-[var(--kama-accent)]"
              size={20}
              strokeWidth={1.5}
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--kama-ink-muted)]">
                Check-in
              </p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-[var(--kama-ink)]">
                {checkInLabel}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-field)] px-4 py-4">
            <Clock
              className="mt-0.5 shrink-0 text-[var(--kama-accent)]"
              size={20}
              strokeWidth={1.5}
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--kama-ink-muted)]">
                Check-out
              </p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-[var(--kama-ink)]">
                {checkOutLabel}
              </p>
            </div>
          </div>
        </div>
      </section>

      {propertyAudioUrl(data.audio) && (
        <section className="min-w-0">
          <h2 className="mb-3 text-xl font-semibold tracking-tight text-[var(--kama-ink)] sm:mb-4 sm:text-2xl">
            Listen to the host
          </h2>
          <div className="rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-field)] p-4 sm:p-6">
            <audio
              controls
              src={propertyAudioUrl(data.audio)}
              className="w-full max-w-full"
            />
          </div>
        </section>
      )}

      <AmenitiesAccordion amenities={data.amenities} />

      <section className="min-w-0 border-t border-[var(--kama-border)] pt-6 sm:pt-8">
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-[var(--kama-ink)] sm:text-2xl">
          Hosted by {ownerName}
        </h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          {ownerImage ? (
            <Image
              src={ownerImage}
              alt=""
              width={64}
              height={64}
              className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-[var(--kama-accent-soft)] sm:h-16 sm:w-16"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[var(--kama-border)] bg-[var(--kama-field)] text-xl font-semibold text-[var(--kama-accent)] sm:h-16 sm:w-16 sm:text-2xl">
              {ownerName?.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-3">
            <p className="font-medium text-[var(--kama-ink-muted)]">Property owner</p>
            <div className="flex flex-col gap-2 font-medium text-[var(--kama-ink)] sm:flex-row sm:flex-wrap sm:gap-6">
              <span className="flex min-w-0 items-start gap-2 break-all">
                <Mail size={16} className="mt-0.5 shrink-0 text-[var(--kama-accent)]" aria-hidden />
                {data.seller_info?.email}
              </span>
              {data.seller_info?.phone && (
                <span className="flex min-w-0 items-center gap-2">
                  <Phone size={16} className="shrink-0 text-[var(--kama-accent)]" aria-hidden />
                  {data.seller_info.phone}
                </span>
              )}
            </div>
            <MessageOwnerButton
              propertyId={data._id}
              ownerId={data.owner}
              ownerName={ownerName}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

export default PropertyDetails;
