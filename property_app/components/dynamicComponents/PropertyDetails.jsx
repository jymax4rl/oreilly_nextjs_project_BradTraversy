"use client";

import React from "react";
import { Bed, Bath, Maximize, Mail, Phone, X } from "lucide-react";
import { useCurrency } from "@/utils/CurrencyContext";
import { formatCurrency } from "@/utils/currencyUtils";
import { propertyAudioUrl } from "@/utils/propertyImageUrl";
import MessageOwnerButton from "@/components/MessageOwnerButton";

function RateRow({ label, amount, currencyCode, rates, available }) {
  const symbol = currencyCode === "USD" ? "$" : currencyCode;

  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3.5 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
      <span className="shrink-0 text-sm font-medium text-slate-600 sm:text-lg sm:font-light">
        {label}
      </span>
      {available ? (
        <span className="min-w-0 text-right text-sm font-bold tabular-nums text-slate-900 break-words sm:text-lg">
          {formatCurrency(amount, rates[currencyCode], symbol)}
        </span>
      ) : (
        <span className="flex shrink-0 items-center gap-1.5 text-sm text-red-500">
          Unavailable <X size={14} strokeWidth={3} aria-hidden />
        </span>
      )}
    </div>
  );
}

function PropertyDetails({ data }) {
  const { currencyCode, rates } = useCurrency();
  const ownerName = data.seller_info?.name || "host";
  const propertyRates = data.rates || {};

  return (
    <div className="min-w-0 space-y-6 sm:space-y-10 lg:col-span-2">
      <div className="grid grid-cols-3 gap-2 border-y border-slate-100 py-4 sm:flex sm:gap-8 sm:py-6">
        <div className="flex min-w-0 flex-col items-center gap-1 text-center sm:flex-row sm:items-center sm:gap-3 sm:text-left">
          <Bed className="text-slate-900" size={22} strokeWidth={1.5} />
          <span className="text-sm font-medium sm:text-lg">
            {data.beds}
            <span className="block text-xs font-normal text-slate-500 sm:ml-1 sm:inline sm:text-base">
              Beds
            </span>
          </span>
        </div>
        <div className="flex min-w-0 flex-col items-center gap-1 border-x border-slate-100 text-center sm:flex-row sm:items-center sm:gap-3 sm:border-0 sm:text-left">
          <Bath className="text-slate-900" size={22} strokeWidth={1.5} />
          <span className="text-sm font-medium sm:text-lg">
            {data.baths}
            <span className="block text-xs font-normal text-slate-500 sm:ml-1 sm:inline sm:text-base">
              Baths
            </span>
          </span>
        </div>
        <div className="flex min-w-0 flex-col items-center gap-1 text-center sm:flex-row sm:items-center sm:gap-3 sm:text-left">
          <Maximize className="text-slate-900" size={22} strokeWidth={1.5} />
          <span className="text-sm font-medium sm:text-lg">
            {data.square_feet?.toLocaleString()}
            <span className="block text-xs font-normal text-slate-500 sm:ml-1 sm:inline sm:text-base">
              sqft
            </span>
          </span>
        </div>
      </div>

      <section className="hidden min-w-0 lg:block">
        <h2 className="mb-4 text-xl font-bold text-slate-900 sm:mb-6 sm:text-2xl">
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
        <h2 className="mb-3 text-xl font-bold text-slate-900 sm:mb-4 sm:text-2xl">
          About this space
        </h2>
        <p className="text-base leading-relaxed font-light whitespace-pre-line text-slate-600 sm:text-lg">
          {data.description}
        </p>
      </section>

      {propertyAudioUrl(data.audio) && (
        <section className="min-w-0">
          <h2 className="mb-3 text-xl font-bold text-slate-900 sm:mb-4 sm:text-2xl">
            Listen to the host
          </h2>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:p-6">
            <audio
              controls
              src={propertyAudioUrl(data.audio)}
              className="w-full max-w-full"
            />
          </div>
        </section>
      )}

      <AmenitiesAccordion amenities={data.amenities} />

      <section className="min-w-0 border-t border-slate-100 pt-6 sm:pt-8">
        <h2 className="mb-4 text-xl font-bold sm:text-2xl">
          Hosted by {ownerName}
        </h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xl font-bold text-slate-400 sm:h-16 sm:w-16 sm:text-2xl">
            {ownerName?.charAt(0)}
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <p className="font-medium text-slate-500">Property owner</p>
            <div className="flex flex-col gap-2 font-medium text-slate-900 sm:flex-row sm:flex-wrap sm:gap-6">
              <span className="flex min-w-0 items-start gap-2 break-all">
                <Mail size={16} className="mt-0.5 shrink-0" aria-hidden />
                {data.seller_info?.email}
              </span>
              {data.seller_info?.phone && (
                <span className="flex min-w-0 items-center gap-2">
                  <Phone size={16} className="shrink-0" aria-hidden />
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
