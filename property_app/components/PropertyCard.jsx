"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Bed, Bath, Ruler, MapPin, Heart } from "lucide-react";
import { formatListingPrice } from "../utils/currencyUtils";
import { useCurrency } from "@/utils/CurrencyContext";
import { propertyCardImageUrl } from "@/utils/propertyImageUrl";
import { propertyPublicPath } from "@/utils/listings/propertyPath";
import MobileMoneyBadge from "@/components/MobileMoneyBadge";
import PropertyShareButton from "@/components/PropertyShareButton";
import { useSession } from "next-auth/react";
import { canUnlockPreviewListing } from "@/utils/listings/previewLockedHost";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const PropertyCard = ({
  property,
  isSaved = false,
  allowOpen = false,
}) => {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const { currencyCode, rates } = useCurrency();
  const {
    name,
    type,
    location,
    beds,
    baths,
    square_feet,
    rates: propertyRates,
    listingPrice,
    images,
    is_featured,
    _id,
    host,
    seller_info,
    previewLocked,
  } = property;

  const locked =
    Boolean(previewLocked) &&
    !allowOpen &&
    !canUnlockPreviewListing(session);
  const hostName = host?.name || seller_info?.name || null;
  const hostImage = host?.image || null;

  const [isLiked, setIsLiked] = useState(isSaved);
  const [isLoading, setIsLoading] = useState(false);

  const mainImage = propertyCardImageUrl(images);

  const getDisplayPrice = (ratesObj) => {
    const nightly = ratesObj?.nightly || listingPrice;
    if (nightly) {
      return {
        price: formatListingPrice(nightly, rates, currencyCode),
        label: t("listing.perNight"),
      };
    }
    if (ratesObj?.weekly) {
      return {
        price: formatListingPrice(ratesObj.weekly, rates, currencyCode),
        label: t("listing.perWeek"),
      };
    }
    if (ratesObj?.monthly) {
      return {
        price: formatListingPrice(ratesObj.monthly, rates, currencyCode),
        label: t("listing.perMonth"),
      };
    }
    return { price: t("listing.contact"), label: t("listing.forRates") };
  };

  const displayRate = getDisplayPrice(propertyRates);

  const handleLikeToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (locked) return;

    if (!session?.user) {
      window.location.href = "/login";
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/user/bookmarks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: _id }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsLiked(data.isBookmarked);
      } else {
        console.error("Bookmark error:", data);
      }
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const listingHref = propertyPublicPath(property);

  const media = (
    <div
      className={`relative h-72 overflow-hidden ${locked ? "" : "cursor-pointer"}`}
    >
      <Image
        loading="eager"
        src={mainImage}
        alt={name}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className={`h-full w-full object-cover transition-transform duration-700 ease-out ${
          locked ? "grayscale" : "transform group-hover:scale-110"
        }`}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80"></div>

      <div className="absolute top-4 left-4 z-10 flex max-w-[85%] flex-wrap gap-2">
        {is_featured && (
          <span className="rounded-lg border border-white/10 bg-black/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-md">
            Featured
          </span>
        )}
        <span className="rounded-lg bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-900 shadow-sm backdrop-blur-md">
          {type}
        </span>
        {!locked ? <MobileMoneyBadge currencyCode={currencyCode} /> : null}
      </div>

      <div className="absolute bottom-4 left-4 right-4 z-10 flex items-end justify-between">
        <div className="text-white">
          <p className="text-2xl font-bold tracking-tight shadow-sm filter drop-shadow-sm">
            {displayRate.price}
            <span className="ml-1 text-sm font-medium text-white/90">
              {displayRate.label}
            </span>
          </p>
        </div>
      </div>
    </div>
  );

  const body = (
    <div className="flex flex-grow flex-col p-6">
      <div className="mb-4">
        <p
          className={`mb-2 line-clamp-1 text-xl font-bold leading-tight transition-colors ${
            locked
              ? "text-gray-500"
              : "text-[var(--kama-ink)] group-hover:text-[var(--kama-accent)]"
          }`}
          title={name}
        >
          {name}
        </p>
        <div className="flex items-center text-sm font-medium text-gray-500">
          <MapPin size={16} className="mr-1.5 text-gray-400" />
          <p>
            {location?.city}, {location?.country}
          </p>
        </div>
        {hostName && !locked && (
          <div className="mt-3 flex items-center gap-2">
            {hostImage ? (
              <Image
                src={hostImage}
                alt=""
                width={28}
                height={28}
                className={`h-7 w-7 rounded-full object-cover ring-1 ring-[var(--kama-accent-soft)] ${
                  locked ? "grayscale" : ""
                }`}
              />
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--kama-accent-soft)] text-xs font-semibold text-[var(--kama-accent)]">
                {hostName.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="truncate text-xs font-medium text-[var(--kama-ink-muted)]">
              {t("listing.hostedBy", { name: hostName })}
            </span>
          </div>
        )}
      </div>

      <div className="mt-auto border-t border-dashed border-gray-200 pt-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex flex-col items-center">
            <span className="flex items-center font-bold text-gray-900">
              <Bed
                size={18}
                className="mr-2 text-[var(--kama-accent)]"
                strokeWidth={2.5}
              />
              {beds}
            </span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {t("listing.beds")}
            </span>
          </div>

          <div className="h-8 w-px bg-gray-200"></div>

          <div className="flex flex-col items-center">
            <span className="flex items-center font-bold text-gray-900">
              <Bath
                size={18}
                className="mr-2 text-[var(--kama-accent)]"
                strokeWidth={2.5}
              />
              {baths}
            </span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {t("listing.baths")}
            </span>
          </div>

          <div className="h-8 w-px bg-gray-200"></div>

          <div className="flex flex-col items-center">
            <span className="flex items-center font-bold text-gray-900">
              <Ruler
                size={18}
                className="mr-2 text-[var(--kama-accent)]"
                strokeWidth={2.5}
              />
              {square_feet?.toLocaleString()}
            </span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {t("listing.sqft")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`relative flex h-full flex-col overflow-hidden rounded-3xl border bg-[var(--kama-surface)] transition-all duration-300 ${
        locked
          ? "cursor-not-allowed border-gray-200 grayscale"
          : "group border-[var(--kama-border)] shadow-sm hover:-translate-y-1 hover:border-[var(--kama-border-strong)] hover:shadow-xl"
      }`}
      aria-disabled={locked || undefined}
    >
      {locked ? media : <Link href={listingHref}>{media}</Link>}

      {!locked ? (
        <>
          <PropertyShareButton
            property={property}
            title={name}
            variant="icon"
            className="top-4 right-16"
          />
          <button
            onClick={handleLikeToggle}
            disabled={isLoading}
            className="group/heart absolute top-4 right-4 z-20 cursor-pointer rounded-full bg-white/20 p-2.5 backdrop-blur-md transition-colors duration-200 hover:bg-white focus:outline-none disabled:opacity-50"
          >
            <Heart
              size={18}
              className={`transition-colors duration-200 ${
                isLiked
                  ? "fill-red-500 text-red-500"
                  : "text-white group-hover/heart:text-gray-900"
              }`}
            />
          </button>
        </>
      ) : null}

      {locked ? body : <Link href={listingHref}>{body}</Link>}
    </div>
  );
};

export default PropertyCard;
