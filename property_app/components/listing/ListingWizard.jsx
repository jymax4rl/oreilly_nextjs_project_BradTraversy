"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Building2,
  Minus,
  Plus,
  ChevronLeft,
  ImagePlus,
  X,
} from "lucide-react";
import GoogleAddressAutocomplete from "@/components/forms/GoogleAddressAutocomplete";
import GoogleMap from "@/components/maps/GoogleMap";
import {
  LISTING_AMENITIES,
  LISTING_PROPERTY_TYPES,
  PRIVACY_TYPES,
  WIZARD_STEPS,
  emptyListingState,
} from "@/components/listing/listingConstants";
import {
  computeListingPrice,
  computeWeekendNightly,
  formatLocationLine,
} from "@/utils/listingPricing";
import { isAddressComplete } from "@/utils/address";

const inputClass =
  "h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-[15px] outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100";

function Stepper({ value, onChange, min = 0, max = 99 }) {
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 text-zinc-700"
        aria-label="Decrease"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-8 text-center text-lg font-semibold">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 text-zinc-700"
        aria-label="Increase"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function ListingWizard() {
  const router = useRouter();
  const { data: session } = useSession();
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState(emptyListingState);
  const [imageFiles, setImageFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const step = WIZARD_STEPS[stepIndex];
  const progress = ((stepIndex + 1) / WIZARD_STEPS.length) * 100;

  const weekendNightly = useMemo(
    () => computeWeekendNightly(data.rates.nightly, data.rates.weekendPremium),
    [data.rates.nightly, data.rates.weekendPremium],
  );

  const canNext = () => {
    switch (step.id) {
      case "intro":
        return true;
      case "type":
        return Boolean(data.type);
      case "privacy":
        return Boolean(data.listing.privacyType);
      case "location":
        return isAddressComplete({
          streetLine1: data.location.street,
          city: data.location.city,
          country: data.location.country,
        });
      case "pin":
        return data.location.lat != null && data.location.lng != null;
      case "basics":
        return data.beds > 0 && data.baths > 0 && data.listing.maxGuests > 0;
      case "photos":
        return imageFiles.length >= 1;
      case "title":
        return data.name.trim().length >= 4 && data.description.trim().length >= 20;
      case "pricing":
        return Number(data.rates.nightly) > 0;
      case "publish":
        return true;
      default:
        return true;
    }
  };

  const goNext = () => {
    if (stepIndex < WIZARD_STEPS.length - 1) {
      setStepIndex((i) => i + 1);
    }
  };

  const goBack = () => {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  };

  const handlePlaceSelect = (parsed) => {
    setData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        formatted: parsed.formatted,
        street: parsed.streetLine1,
        streetLine2: parsed.streetLine2 || "",
        city: parsed.city,
        state: parsed.state,
        zipcode: parsed.postalCode,
        country: parsed.country,
        countryCode: parsed.countryCode,
        placeId: parsed.placeId,
        lat: parsed.lat,
        lng: parsed.lng,
      },
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("type", data.type);
      formData.append("name", data.name);
      formData.append("description", data.description);
      formData.append("beds", String(data.beds));
      formData.append("baths", String(data.baths));
      formData.append("square_feet", String(data.square_feet));

      const loc = data.location;
      formData.append("location.street", loc.street);
      formData.append("location.streetLine2", loc.streetLine2 || "");
      formData.append("location.city", loc.city);
      formData.append("location.state", loc.state || "");
      formData.append("location.zipcode", loc.zipcode || "");
      formData.append("location.country", loc.country);
      formData.append("location.formatted", loc.formatted || formatLocationLine(loc));
      formData.append("location.placeId", loc.placeId || "");
      if (loc.lat != null) formData.append("location.lat", String(loc.lat));
      if (loc.lng != null) formData.append("location.lng", String(loc.lng));
      formData.append(
        "location.showExactLocation",
        loc.showExactLocation ? "true" : "false",
      );

      formData.append("listing.privacyType", data.listing.privacyType);
      formData.append("listing.maxGuests", String(data.listing.maxGuests));
      formData.append(
        "listing.bedroomHasLock",
        data.listing.bedroomHasLock ? "true" : "false",
      );

      data.amenities.forEach((a) => formData.append("amenities", a));

      formData.append("rates.nightly", String(data.rates.nightly));
      if (data.rates.weekly) formData.append("rates.weekly", String(data.rates.weekly));
      if (data.rates.monthly) formData.append("rates.monthly", String(data.rates.monthly));
      formData.append("rates.weekendPremium", String(data.rates.weekendPremium || 0));

      const seller = {
        name: data.seller_info.name || session?.user?.name || "",
        email: data.seller_info.email || session?.user?.email || "",
        phone: data.seller_info.phone || "",
      };
      formData.append("seller_info.name", seller.name);
      formData.append("seller_info.email", seller.email);
      formData.append("seller_info.phone", seller.phone);

      imageFiles.forEach((file) => formData.append("images", file));

      const res = await fetch("/api/properties", {
        method: "POST",
        body: formData,
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || "Failed to create listing");
      }

      if (payload.redirectUrl) {
        router.push(payload.redirectUrl);
        return;
      }

      router.push("/properties/my-listings");
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <header className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="text-sm font-semibold text-zinc-700 hover:text-zinc-900"
        >
          Save & exit
        </Link>
        <span className="text-sm font-medium text-zinc-500">
          Step {stepIndex + 1} of {WIZARD_STEPS.length}
        </span>
        <span className="w-16" />
      </header>

      <div className="h-1 bg-zinc-100">
        <div
          className="h-full bg-violet-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:px-6">
        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {step.id === "intro" && (
          <div className="flex flex-1 flex-col justify-center">
            <p className="text-sm font-bold uppercase tracking-widest text-violet-600">
              Kama Properties
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              It&apos;s easy to list your place
            </h1>
            <ol className="mt-8 space-y-5">
              {[
                "Tell us about your place — type, location, and capacity",
                "Make it stand out — amenities and photos",
                "Finish up — set pricing and publish",
              ].map((text, i) => (
                <li key={text} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                    {i + 1}
                  </span>
                  <p className="pt-1 text-zinc-700">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {step.id === "type" && (
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
              Which of these best describes your place?
            </h1>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {LISTING_PROPERTY_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setData((p) => ({ ...p, type: t.id }))}
                  className={`rounded-2xl border-2 px-4 py-5 text-left transition ${
                    data.type === t.id
                      ? "border-zinc-900 bg-zinc-50"
                      : "border-zinc-200 hover:border-zinc-400"
                  }`}
                >
                  <Building2 className="mb-2 h-5 w-5 text-zinc-600" />
                  <span className="font-semibold text-zinc-900">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step.id === "privacy" && (
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
              What type of place will guests have?
            </h1>
            <div className="mt-8 space-y-3">
              {PRIVACY_TYPES.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    setData((p) => ({
                      ...p,
                      listing: { ...p.listing, privacyType: opt.id },
                    }))
                  }
                  className={`w-full rounded-2xl border-2 px-5 py-4 text-left transition ${
                    data.listing.privacyType === opt.id
                      ? "border-zinc-900 bg-zinc-50"
                      : "border-zinc-200 hover:border-zinc-400"
                  }`}
                >
                  <p className="font-semibold text-zinc-900">{opt.label}</p>
                  <p className="mt-1 text-sm text-zinc-600">{opt.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step.id === "location" && (
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
              Where&apos;s your place located?
            </h1>
            <p className="mt-2 text-zinc-600">
              Your address is only shared with guests after they book.
            </p>
            <div className="mt-8 space-y-4">
              <GoogleAddressAutocomplete
                value={data.location.formatted || data.location.street}
                onChange={(v) =>
                  setData((p) => ({
                    ...p,
                    location: { ...p.location, formatted: v, street: v },
                  }))
                }
                onPlaceSelect={handlePlaceSelect}
                placeholder="Enter your address"
              />
              <input
                className={inputClass}
                placeholder="Street address *"
                value={data.location.street}
                onChange={(e) =>
                  setData((p) => ({
                    ...p,
                    location: { ...p.location, street: e.target.value },
                  }))
                }
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  className={inputClass}
                  placeholder="City *"
                  value={data.location.city}
                  onChange={(e) =>
                    setData((p) => ({
                      ...p,
                      location: { ...p.location, city: e.target.value },
                    }))
                  }
                />
                <input
                  className={inputClass}
                  placeholder="State / region"
                  value={data.location.state}
                  onChange={(e) =>
                    setData((p) => ({
                      ...p,
                      location: { ...p.location, state: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  className={inputClass}
                  placeholder="Postal code"
                  value={data.location.zipcode}
                  onChange={(e) =>
                    setData((p) => ({
                      ...p,
                      location: { ...p.location, zipcode: e.target.value },
                    }))
                  }
                />
                <input
                  className={inputClass}
                  placeholder="Country *"
                  value={data.location.country}
                  onChange={(e) =>
                    setData((p) => ({
                      ...p,
                      location: { ...p.location, country: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
          </div>
        )}

        {step.id === "pin" && (
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
              Is the pin in the right spot?
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Drag the map or pin to adjust. Guests see an approximate area until
              they book.
            </p>
            <p className="mt-4 rounded-xl bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-800">
              {formatLocationLine(data.location)}
            </p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200">
              <GoogleMap
                lat={data.location.lat ?? 6.5244}
                lng={data.location.lng ?? 3.3792}
                draggable
                onPositionChange={({ lat, lng }) =>
                  setData((p) => ({
                    ...p,
                    location: { ...p.location, lat, lng },
                  }))
                }
                className="h-80 w-full"
              />
            </div>
            <label className="mt-4 flex items-center gap-3 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={data.location.showExactLocation}
                onChange={(e) =>
                  setData((p) => ({
                    ...p,
                    location: {
                      ...p.location,
                      showExactLocation: e.target.checked,
                    },
                  }))
                }
                className="h-4 w-4 rounded border-zinc-300"
              />
              Show your specific location on the listing map
            </label>
          </div>
        )}

        {step.id === "basics" && (
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
              Share some basics about your place
            </h1>
            <div className="mt-8 space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <span className="font-medium text-zinc-800">Guests</span>
                <Stepper
                  value={data.listing.maxGuests}
                  min={1}
                  max={30}
                  onChange={(n) =>
                    setData((p) => ({
                      ...p,
                      listing: { ...p.listing, maxGuests: n },
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <span className="font-medium text-zinc-800">Beds</span>
                <Stepper
                  value={data.beds}
                  min={1}
                  max={30}
                  onChange={(n) => setData((p) => ({ ...p, beds: n }))}
                />
              </div>
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <span className="font-medium text-zinc-800">Bathrooms</span>
                <Stepper
                  value={data.baths}
                  min={1}
                  max={20}
                  onChange={(n) => setData((p) => ({ ...p, baths: n }))}
                />
              </div>
              <label className="flex items-center justify-between">
                <span className="font-medium text-zinc-800">
                  Does every bedroom have a lock?
                </span>
                <input
                  type="checkbox"
                  checked={data.listing.bedroomHasLock}
                  onChange={(e) =>
                    setData((p) => ({
                      ...p,
                      listing: {
                        ...p.listing,
                        bedroomHasLock: e.target.checked,
                      },
                    }))
                  }
                  className="h-5 w-5"
                />
              </label>
            </div>
          </div>
        )}

        {step.id === "amenities" && (
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
              Tell guests what your place offers
            </h1>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {LISTING_AMENITIES.map((amenity) => {
                const selected = data.amenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() =>
                      setData((p) => ({
                        ...p,
                        amenities: selected
                          ? p.amenities.filter((a) => a !== amenity)
                          : [...p.amenities, amenity],
                      }))
                    }
                    className={`rounded-2xl border-2 px-4 py-4 text-left text-sm font-medium transition ${
                      selected
                        ? "border-zinc-900 bg-zinc-50"
                        : "border-zinc-200"
                    }`}
                  >
                    {amenity}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step.id === "photos" && (
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
              Add photos of your place
            </h1>
            <p className="mt-2 text-zinc-600">
              You&apos;ll need at least 1 photo. Add more anytime after publishing.
            </p>
            <label className="mt-8 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 hover:border-violet-400">
              <ImagePlus className="h-10 w-10 text-zinc-400" />
              <span className="mt-3 font-semibold text-zinc-800">Add photos</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setImageFiles((prev) => [...prev, ...files]);
                }}
              />
            </label>
            {imageFiles.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {imageFiles.map((file, i) => (
                  <li
                    key={`${file.name}-${i}`}
                    className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm"
                  >
                    <span className="truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setImageFiles((prev) => prev.filter((_, j) => j !== i))
                      }
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}

        {step.id === "title" && (
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
              Now, let&apos;s give your place a title
            </h1>
            <input
              className={`${inputClass} mt-8 text-lg`}
              maxLength={50}
              placeholder="Short catchy title"
              value={data.name}
              onChange={(e) => setData((p) => ({ ...p, name: e.target.value }))}
            />
            <p className="mt-1 text-xs text-zinc-500">{data.name.length}/50</p>
            <textarea
              className={`${inputClass} mt-6 min-h-[140px] resize-y py-3`}
              placeholder="Describe what makes your place special for African and international travelers…"
              value={data.description}
              onChange={(e) =>
                setData((p) => ({ ...p, description: e.target.value }))
              }
            />
          </div>
        )}

        {step.id === "pricing" && (
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
              Set your nightly price
            </h1>
            <p className="mt-2 text-zinc-600">Prices are stored in USD. Guests see converted rates.</p>
            <div className="mt-8 text-center">
              <span className="text-5xl font-bold text-zinc-900">
                ${Number(data.rates.nightly) || 0}
              </span>
              <span className="text-zinc-500"> / night</span>
            </div>
            <input
              type="range"
              min={10}
              max={2000}
              step={5}
              value={data.rates.nightly}
              onChange={(e) =>
                setData((p) => ({
                  ...p,
                  rates: { ...p.rates, nightly: Number(e.target.value) },
                }))
              }
              className="mt-6 w-full accent-violet-600"
            />
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <span className="font-medium text-zinc-800">Weekend premium</span>
                <span className="text-sm text-zinc-600">
                  {data.rates.weekendPremium}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                value={data.rates.weekendPremium}
                onChange={(e) =>
                  setData((p) => ({
                    ...p,
                    rates: {
                      ...p.rates,
                      weekendPremium: Number(e.target.value),
                    },
                  }))
                }
                className="mt-2 w-full accent-violet-600"
              />
              {weekendNightly ? (
                <p className="mt-2 text-sm text-zinc-600">
                  Fri–Sat guest price:{" "}
                  <strong>${weekendNightly}/night</strong>
                </p>
              ) : null}
            </div>
          </div>
        )}

        {step.id === "publish" && (
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
              Ready to publish?
            </h1>
            <div className="mt-8 space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-sm">
              <p>
                <strong>Type:</strong> {data.type} · {data.listing.privacyType?.replace("_", " ")}
              </p>
              <p>
                <strong>Location:</strong> {formatLocationLine(data.location)}
              </p>
              <p>
                <strong>Guests:</strong> {data.listing.maxGuests} ·{" "}
                <strong>Beds:</strong> {data.beds} · <strong>Baths:</strong>{" "}
                {data.baths}
              </p>
              <p>
                <strong>Price:</strong> ${data.rates.nightly}/night
                {data.rates.weekendPremium
                  ? ` (+${data.rates.weekendPremium}% weekends)`
                  : ""}
              </p>
              <p>
                <strong>Photos:</strong> {imageFiles.length}
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="sticky bottom-0 border-t border-zinc-100 bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
          <button
            type="button"
            onClick={goBack}
            disabled={stepIndex === 0}
            className="flex items-center gap-1 text-sm font-semibold text-zinc-700 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          {step.id === "publish" ? (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="rounded-full bg-zinc-900 px-8 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {submitting ? "Publishing…" : "Create listing"}
            </button>
          ) : (
            <button
              type="button"
              disabled={!canNext()}
              onClick={goNext}
              className="rounded-full bg-zinc-900 px-8 py-3 text-sm font-bold text-white disabled:bg-zinc-300"
            >
              Next
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
