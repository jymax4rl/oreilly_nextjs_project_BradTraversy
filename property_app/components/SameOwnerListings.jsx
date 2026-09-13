"use client";

import Link from "next/link";
import Image from "next/image";
import { Bath, Bed, MapPin, Users } from "lucide-react";
import { useCurrency } from "@/utils/CurrencyContext";
import { formatListingPrice } from "@/utils/currencyUtils";
import { propertyCardImageUrl } from "@/utils/propertyImageUrl";
import { propertyPublicPath } from "@/utils/listings/propertyPath";
import { useLanguage } from "@/components/i18n/LanguageProvider";

function cardPrice(property, rates, currencyCode, t) {
  const nightly = property.rates?.nightly || property.listingPrice;
  if (nightly) {
    return {
      price: formatListingPrice(nightly, rates, currencyCode),
      label: t("listing.perNight"),
    };
  }
  if (property.rates?.weekly) {
    return {
      price: formatListingPrice(property.rates.weekly, rates, currencyCode),
      label: t("listing.perWeek"),
    };
  }
  if (property.rates?.monthly) {
    return {
      price: formatListingPrice(property.rates.monthly, rates, currencyCode),
      label: t("listing.perMonth"),
    };
  }
  return { price: t("listing.contact"), label: t("listing.forRates") };
}

function locationLabel(location) {
  return [location?.city, location?.country].filter(Boolean).join(", ");
}

function SameOwnerCard({ property }) {
  const { t } = useLanguage();
  const { currencyCode, rates } = useCurrency();
  const href = propertyPublicPath(property);
  const image = propertyCardImageUrl(property.images);
  const place = locationLabel(property.location);
  const display = cardPrice(property, rates, currencyCode, t);
  const guests = Number(property.listing?.maxGuests);

  return (
    <Link
      href={href}
      className="group flex w-[min(78vw,17.5rem)] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] shadow-[0_10px_28px_-22px_rgba(27,92,87,0.55)] transition duration-300 hover:-translate-y-0.5 hover:border-[var(--kama-border-strong)] hover:shadow-[0_18px_36px_-24px_rgba(27,92,87,0.65)] sm:w-auto"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={image}
          alt={property.name || ""}
          fill
          sizes="(max-width: 640px) 78vw, (max-width: 1024px) 45vw, 25vw"
          className="object-cover transition duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        {property.type ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/92 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--kama-ink)] shadow-sm backdrop-blur-sm">
            {property.type}
          </span>
        ) : null}
        {place ? (
          <p className="absolute inset-x-3 bottom-3 flex items-start gap-1.5 text-xs font-medium text-white">
            <MapPin
              size={13}
              className="mt-0.5 shrink-0 text-white/90"
              aria-hidden
            />
            <span className="line-clamp-2 drop-shadow-sm">{place}</span>
          </p>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 px-3.5 py-3">
        <h3
          className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--kama-ink)] transition-colors group-hover:text-[var(--kama-accent)]"
          title={property.name}
        >
          {property.name}
        </h3>
        <p className="text-[15px] font-semibold tabular-nums text-[var(--kama-ink)]">
          {display.price}
          <span className="ml-1 text-xs font-medium text-[var(--kama-ink-muted)]">
            {display.label}
          </span>
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-[var(--kama-ink-muted)]">
          {property.beds != null ? (
            <span className="inline-flex items-center gap-1">
              <Bed size={13} className="text-[var(--kama-accent)]" aria-hidden />
              {property.beds} {t("listing.beds")}
            </span>
          ) : null}
          {property.baths != null ? (
            <span className="inline-flex items-center gap-1">
              <Bath size={13} className="text-[var(--kama-accent)]" aria-hidden />
              {property.baths} {t("listing.baths")}
            </span>
          ) : null}
          {Number.isFinite(guests) && guests > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Users size={13} className="text-[var(--kama-accent)]" aria-hidden />
              {guests} {t("listing.guests")}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export default function SameOwnerListings({ listings, hostName }) {
  const { t } = useLanguage();
  if (!Array.isArray(listings) || listings.length === 0) return null;

  const heading = hostName
    ? t("listing.moreFromHost", { name: hostName })
    : t("listing.moreFromHostFallback");

  return (
    <section
      id="more-from-host"
      aria-labelledby="more-from-host-heading"
      className="min-w-0 border-t border-[var(--kama-border)] pt-8 sm:pt-10"
    >
      <div className="mb-4 flex items-end justify-between gap-3 sm:mb-5">
        <h2
          id="more-from-host-heading"
          className="text-xl font-semibold tracking-tight text-[var(--kama-ink)] sm:text-2xl"
        >
          {heading}
        </h2>
        <p className="hidden shrink-0 text-xs font-medium text-[var(--kama-ink-muted)] sm:block">
          {t("listing.moreStays", { count: listings.length })}
        </p>
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:thin] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {listings.map((property) => (
          <SameOwnerCard
            key={property._id || property.slug}
            property={property}
          />
        ))}
      </div>
    </section>
  );
}
