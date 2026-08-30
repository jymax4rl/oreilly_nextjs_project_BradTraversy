"use client";

import { useEffect, useMemo, useState, useCallback, useId, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Minus,
  Plus,
  ChevronLeft,
  ImagePlus,
  X,
  Check,
  Mic,
  Square,
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
  computeWeekendNightly,
  formatLocationLine,
} from "@/utils/listingPricing";
import { estimateCoordinates, softEstimateCoordinates, isAddressComplete } from "@/utils/address";
import { GOOGLE_MAPS_LOAD_TIMEOUT_MS } from "@/utils/googleMaps";
import {
  compressListingImages,
  totalBytes,
  MAX_LISTING_UPLOAD_BYTES,
} from "@/utils/compressListingImage";
import {
  IntroIllustration,
  PropertyTypeArt,
  PrivacyArt,
  LocationIllustration,
  BasicsIllustration,
  AmenitiesIllustration,
  PhotosIllustration,
  AudioIllustration,
  TitleIllustration,
  PricingIllustration,
  PublishIllustration,
  StepBadge,
} from "@/components/listing/illustrations";
import "@/components/listing/listingWizard.css";

const inputClass =
  "h-12 w-full rounded-xl border border-[var(--kama-border)] bg-[var(--kama-surface)] px-4 text-[15px] text-[var(--kama-ink)] outline-none transition placeholder:text-[var(--kama-ink-muted)] focus:border-[var(--kama-accent)] focus:ring-2 focus:ring-[var(--kama-accent)]/15";

function Stepper({ value, onChange, min = 0, max = 99, label }) {
  const id = useId();
  return (
    <div className="flex items-center gap-4" role="group" aria-labelledby={id}>
      <span id={id} className="sr-only">
        {label}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--kama-border-strong)] text-[var(--kama-ink)] transition hover:bg-[var(--kama-field)]"
        aria-label={`Decrease ${label}`}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-8 text-center text-lg font-semibold tabular-nums text-[var(--kama-ink)]">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--kama-border-strong)] text-[var(--kama-ink)] transition hover:bg-[var(--kama-field)]"
        aria-label={`Increase ${label}`}
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
  const [imagePreviews, setImagePreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [pinEstimated, setPinEstimated] = useState(false);
  const [resolvingPin, setResolvingPin] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const step = WIZARD_STEPS[stepIndex];
  const progress = ((stepIndex + 1) / WIZARD_STEPS.length) * 100;

  const weekendNightly = useMemo(
    () => computeWeekendNightly(data.rates.nightly, data.rates.weekendPremium),
    [data.rates.nightly, data.rates.weekendPremium],
  );

  useEffect(() => {
    const urls = imageFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageFiles]);

  useEffect(() => {
    return () => {
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    };
  }, [audioPreviewUrl]);

  const clearAudio = useCallback(() => {
    setAudioBlob(null);
    setAudioPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : undefined;
      mediaRecorderRef.current = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: mediaRecorderRef.current?.mimeType || "audio/webm",
        });
        audioChunksRef.current = [];
        setAudioBlob(blob);
        setAudioPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch {
      setError("Microphone access is required to record an audio tour.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const addressComplete = isAddressComplete({
    streetLine1: data.location.street,
    city: data.location.city,
    country: data.location.country,
  });

  const resolvePinWithBudget = useCallback(async (location) => {
    // Hard budget so Next / pin step never waits forever on Maps.
    const budgetMs = GOOGLE_MAPS_LOAD_TIMEOUT_MS + 2_000;
    let timer;
    try {
      return await Promise.race([
        estimateCoordinates(location),
        new Promise((_, reject) => {
          timer = setTimeout(
            () => reject(new Error("pin-resolve-timeout")),
            budgetMs,
          );
        }),
      ]);
    } catch {
      return softEstimateCoordinates(location);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }, []);

  const ensurePinCoordinates = useCallback(async () => {
    if (data.location.lat != null && data.location.lng != null) {
      setPinEstimated(false);
      return true;
    }
    setResolvingPin(true);
    try {
      const result = await resolvePinWithBudget({
        street: data.location.street,
        city: data.location.city,
        state: data.location.state,
        zipcode: data.location.zipcode,
        country: data.location.country,
      });
      setData((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          lat: result.lat,
          lng: result.lng,
        },
      }));
      setPinEstimated(Boolean(result.estimated));
      return true;
    } finally {
      setResolvingPin(false);
    }
  }, [
    data.location.lat,
    data.location.lng,
    data.location.street,
    data.location.city,
    data.location.state,
    data.location.zipcode,
    data.location.country,
    resolvePinWithBudget,
  ]);

  useEffect(() => {
    if (step.id !== "pin") return;
    if (data.location.lat != null && data.location.lng != null) return;
    let cancelled = false;
    (async () => {
      setResolvingPin(true);
      try {
        const result = await resolvePinWithBudget({
          street: data.location.street,
          city: data.location.city,
          state: data.location.state,
          zipcode: data.location.zipcode,
          country: data.location.country,
        });
        if (cancelled) return;
        setData((prev) => ({
          ...prev,
          location: {
            ...prev.location,
            lat: result.lat,
            lng: result.lng,
          },
        }));
        setPinEstimated(Boolean(result.estimated));
      } finally {
        if (!cancelled) setResolvingPin(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Intentionally only when entering pin without coords
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id]);

  const canNext = () => {
    switch (step.id) {
      case "intro":
        return true;
      case "type":
        return Boolean(data.type);
      case "privacy":
        return Boolean(data.listing.privacyType);
      case "location":
        return addressComplete;
      case "pin":
        // Soft: coords may be estimated; never hard-block when address is complete
        return (
          (data.location.lat != null && data.location.lng != null) ||
          addressComplete
        );
      case "basics":
        return data.beds > 0 && data.baths > 0 && data.listing.maxGuests > 0;
      case "amenities":
        return true;
      case "photos":
        return imageFiles.length >= 1;
      case "audio":
        return true;
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

  const goNext = async () => {
    if (step.id === "location" && addressComplete) {
      await ensurePinCoordinates();
    }
    if (step.id === "pin") {
      await ensurePinCoordinates();
    }
    if (stepIndex < WIZARD_STEPS.length - 1) {
      setStepIndex((i) => i + 1);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const goBack = () => {
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handlePlaceSelect = useCallback((parsed) => {
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
    setPinEstimated(false);
  }, []);

  const handleMapPositionChange = useCallback(({ lat, lng }) => {
    setPinEstimated(false);
    setData((p) => ({
      ...p,
      location: { ...p.location, lat, lng },
    }));
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");

    try {
      if (!imageFiles.length) {
        throw new Error("Add at least one photo before publishing.");
      }

      const pin = await resolvePinWithBudget({
        street: data.location.street,
        city: data.location.city,
        state: data.location.state,
        zipcode: data.location.zipcode,
        country: data.location.country,
        lat: data.location.lat,
        lng: data.location.lng,
      });

      // Compress photos so the request stays under Vercel’s ~4.5MB body limit.
      const uploadImages = await compressListingImages(imageFiles);
      let audioForUpload = null;
      if (audioBlob && audioBlob.size > 0) {
        const ext = audioBlob.type?.includes("wav") ? "wav" : "webm";
        audioForUpload = new File([audioBlob], `tour.${ext}`, {
          type: audioBlob.type || "audio/webm",
        });
      }

      const mediaBytes =
        totalBytes(uploadImages) + (audioForUpload?.size || 0);
      if (mediaBytes > MAX_LISTING_UPLOAD_BYTES) {
        throw new Error(
          "Photos are still too large after compression. Use fewer or smaller images (under ~4MB total) and try again.",
        );
      }

      const formData = new FormData();
      formData.append("type", data.type);
      formData.append("name", data.name);
      formData.append("description", data.description);
      formData.append("beds", String(data.beds));
      formData.append("baths", String(data.baths));
      formData.append("square_feet", String(data.square_feet));

      const loc = {
        ...data.location,
        lat: pin.lat,
        lng: pin.lng,
      };
      formData.append("location.street", loc.street);
      formData.append("location.streetLine2", loc.streetLine2 || "");
      formData.append("location.city", loc.city);
      formData.append("location.state", loc.state || "");
      formData.append("location.zipcode", loc.zipcode || "");
      formData.append("location.country", loc.country);
      formData.append(
        "location.formatted",
        loc.formatted || formatLocationLine(loc),
      );
      formData.append("location.placeId", loc.placeId || "");
      formData.append("location.lat", String(loc.lat));
      formData.append("location.lng", String(loc.lng));
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
      if (data.rates.monthly)
        formData.append("rates.monthly", String(data.rates.monthly));
      formData.append(
        "rates.weekendPremium",
        String(data.rates.weekendPremium || 0),
      );

      const seller = {
        name: data.seller_info.name || session?.user?.name || "",
        email: data.seller_info.email || session?.user?.email || "",
        phone: data.seller_info.phone || "",
      };
      formData.append("seller_info.name", seller.name);
      formData.append("seller_info.email", seller.email);
      formData.append("seller_info.phone", seller.phone);

      uploadImages.forEach((file) => formData.append("images", file));
      if (audioForUpload) {
        formData.append("audio", audioForUpload);
      }

      const res = await fetch("/api/properties", {
        method: "POST",
        body: formData,
      });

      const rawText = await res.text();
      let payload = {};
      try {
        payload = rawText ? JSON.parse(rawText) : {};
      } catch {
        payload = {};
      }

      if (!res.ok) {
        const hint =
          res.status === 413 || /Request Entity Too Large|payload/i.test(rawText)
            ? "Upload is too large for the server. Use fewer or smaller photos."
            : res.status === 401
              ? "Your session expired. Sign in again and retry."
              : res.status === 403
                ? payload.error || "Only verified hosts can publish listings."
                : payload.error ||
                  (res.status >= 500
                    ? "Server error while creating the listing. Try again with fewer photos."
                    : `Failed to create listing (${res.status}).`);
        throw new Error(hint);
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

  // Do not gate Next on resolvingPin — Maps may be slow; pin resolve has a hard budget.
  const nextEnabled = canNext() && !submitting;

  return (
    <div
      className="listing-wizard flex min-h-dvh flex-col bg-[var(--kama-canvas)]"
      data-listing-wizard
    >
      <header className="sticky top-0 z-[60] border-b border-[var(--kama-border)] bg-[var(--kama-surface)]/95 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/host/listings"
            className="min-h-[44px] min-w-[44px] text-sm font-semibold text-[var(--kama-ink-muted)] transition hover:text-[var(--kama-ink)]"
          >
            Save & exit
          </Link>
          <span className="text-sm font-medium text-[var(--kama-ink-muted)]">
            Step {stepIndex + 1} of {WIZARD_STEPS.length}
          </span>
          <span className="w-16" aria-hidden />
        </div>
        <div className="h-1 bg-[var(--kama-field)]" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="wizard-progress-fill h-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 pb-28 sm:px-6">
        {error ? (
          <div
            className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <div key={step.id} className="wizard-step-enter flex flex-1 flex-col">
          {step.id === "intro" && (
            <div className="flex flex-1 flex-col justify-center">
              <IntroIllustration className="mx-auto mb-6 h-36 w-full max-w-xs" />
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--kama-accent)]">
                Kama Properties
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--kama-ink)] sm:text-4xl">
                It&apos;s easy to list your place
              </h1>
              <ol className="mt-8 space-y-5">
                {[
                  "Tell us about your place — type, location, and capacity",
                  "Make it stand out — amenities and photos",
                  "Finish up — set pricing and publish",
                ].map((text, i) => (
                  <li key={text} className="flex gap-4">
                    <StepBadge n={i + 1} />
                    <p className="pt-1.5 text-[var(--kama-ink-muted)]">{text}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {step.id === "type" && (
            <div>
              <h1 className="text-2xl font-bold text-[var(--kama-ink)] sm:text-3xl">
                Which of these best describes your place?
              </h1>
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {LISTING_PROPERTY_TYPES.map((t) => {
                  const selected = data.type === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setData((p) => ({ ...p, type: t.id }))}
                      className={`wizard-select-card rounded-2xl border-2 px-4 py-5 text-left ${
                        selected
                          ? "is-selected border-[var(--kama-ink)]"
                          : "border-[var(--kama-border)] hover:border-[var(--kama-border-strong)]"
                      }`}
                    >
                      <PropertyTypeArt typeId={t.id} className="mb-3 h-10 w-10" />
                      <span className="font-semibold text-[var(--kama-ink)]">
                        {t.label}
                      </span>
                      {selected ? (
                        <Check
                          className="mt-2 h-4 w-4 text-[var(--kama-accent)]"
                          aria-hidden
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step.id === "privacy" && (
            <div>
              <h1 className="text-2xl font-bold text-[var(--kama-ink)] sm:text-3xl">
                What type of place will guests have?
              </h1>
              <div className="mt-8 space-y-3">
                {PRIVACY_TYPES.map((opt) => {
                  const selected = data.listing.privacyType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        setData((p) => ({
                          ...p,
                          listing: { ...p.listing, privacyType: opt.id },
                        }))
                      }
                      className={`wizard-select-card flex w-full items-start gap-4 rounded-2xl border-2 px-5 py-4 text-left ${
                        selected
                          ? "is-selected border-[var(--kama-ink)]"
                          : "border-[var(--kama-border)] hover:border-[var(--kama-border-strong)]"
                      }`}
                    >
                      <PrivacyArt privacyId={opt.id} />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-[var(--kama-ink)]">
                          {opt.label}
                        </span>
                        <span className="mt-1 block text-sm text-[var(--kama-ink-muted)]">
                          {opt.description}
                        </span>
                      </span>
                      {selected ? (
                        <Check
                          className="mt-1 h-5 w-5 shrink-0 text-[var(--kama-accent)]"
                          aria-hidden
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step.id === "location" && (
            <div>
              <LocationIllustration className="mb-4 h-24 w-full max-w-[200px]" />
              <h1 className="text-2xl font-bold text-[var(--kama-ink)] sm:text-3xl">
                Where&apos;s your place located?
              </h1>
              <p className="mt-2 text-[var(--kama-ink-muted)]">
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
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--kama-ink-muted)]" htmlFor="wiz-street">
                    Street address *
                  </label>
                  <input
                    id="wiz-street"
                    className={inputClass}
                    placeholder="Street address"
                    value={data.location.street}
                    onChange={(e) =>
                      setData((p) => ({
                        ...p,
                        location: { ...p.location, street: e.target.value },
                      }))
                    }
                    required
                    autoComplete="street-address"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[var(--kama-ink-muted)]" htmlFor="wiz-city">
                      City *
                    </label>
                    <input
                      id="wiz-city"
                      className={inputClass}
                      placeholder="City"
                      value={data.location.city}
                      onChange={(e) =>
                        setData((p) => ({
                          ...p,
                          location: { ...p.location, city: e.target.value },
                        }))
                      }
                      required
                      autoComplete="address-level2"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[var(--kama-ink-muted)]" htmlFor="wiz-state">
                      State / region
                    </label>
                    <input
                      id="wiz-state"
                      className={inputClass}
                      placeholder="State / region"
                      value={data.location.state}
                      onChange={(e) =>
                        setData((p) => ({
                          ...p,
                          location: { ...p.location, state: e.target.value },
                        }))
                      }
                      autoComplete="address-level1"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[var(--kama-ink-muted)]" htmlFor="wiz-zip">
                      Postal code
                    </label>
                    <input
                      id="wiz-zip"
                      className={inputClass}
                      placeholder="Postal code"
                      value={data.location.zipcode}
                      onChange={(e) =>
                        setData((p) => ({
                          ...p,
                          location: { ...p.location, zipcode: e.target.value },
                        }))
                      }
                      autoComplete="postal-code"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[var(--kama-ink-muted)]" htmlFor="wiz-country">
                      Country *
                    </label>
                    <input
                      id="wiz-country"
                      className={inputClass}
                      placeholder="Country"
                      value={data.location.country}
                      onChange={(e) =>
                        setData((p) => ({
                          ...p,
                          location: { ...p.location, country: e.target.value },
                        }))
                      }
                      required
                      autoComplete="country-name"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step.id === "pin" && (
            <div>
              <h1 className="text-2xl font-bold text-[var(--kama-ink)] sm:text-3xl">
                Is the pin in the right spot?
              </h1>
              <p className="mt-2 text-sm text-[var(--kama-ink-muted)]">
                Drag the map or pin to adjust. Guests see an approximate area
                until they book.
              </p>
              <p className="mt-4 rounded-xl bg-[var(--kama-field)] px-4 py-3 text-sm font-medium text-[var(--kama-ink)]">
                {formatLocationLine(data.location) || "Address pending"}
              </p>
              <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--kama-border)]">
                {resolvingPin && data.location.lat == null ? (
                  <div
                    className="flex h-80 flex-col items-center justify-center gap-3 bg-[var(--kama-field)] text-sm text-[var(--kama-ink-muted)]"
                    role="status"
                    aria-live="polite"
                  >
                    <div
                      className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--kama-accent)] border-t-transparent"
                      aria-hidden
                    />
                    <span>Finding approximate location…</span>
                    <span className="max-w-xs text-center text-xs">
                      If this takes too long, we will use a city estimate so you
                      can continue.
                    </span>
                  </div>
                ) : (
                  <GoogleMap
                    lat={data.location.lat}
                    lng={data.location.lng}
                    draggable
                    estimated={pinEstimated}
                    onPositionChange={handleMapPositionChange}
                    className="h-80 w-full"
                  />
                )}
              </div>
              <label className="mt-4 flex min-h-[44px] items-center gap-3 text-sm text-[var(--kama-ink)]">
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
                  className="h-4 w-4 rounded border-[var(--kama-border)] accent-[var(--kama-accent)]"
                />
                Show your specific location on the listing map
              </label>
            </div>
          )}

          {step.id === "basics" && (
            <div>
              <BasicsIllustration className="mb-4 h-20 w-full max-w-[160px]" />
              <h1 className="text-2xl font-bold text-[var(--kama-ink)] sm:text-3xl">
                Share some basics about your place
              </h1>
              <div className="mt-8 space-y-6">
                <div className="flex items-center justify-between border-b border-[var(--kama-border)] pb-4">
                  <span className="font-medium text-[var(--kama-ink)]">Guests</span>
                  <Stepper
                    label="guests"
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
                <div className="flex items-center justify-between border-b border-[var(--kama-border)] pb-4">
                  <span className="font-medium text-[var(--kama-ink)]">Beds</span>
                  <Stepper
                    label="beds"
                    value={data.beds}
                    min={1}
                    max={30}
                    onChange={(n) => setData((p) => ({ ...p, beds: n }))}
                  />
                </div>
                <div className="flex items-center justify-between border-b border-[var(--kama-border)] pb-4">
                  <span className="font-medium text-[var(--kama-ink)]">
                    Bathrooms
                  </span>
                  <Stepper
                    label="bathrooms"
                    value={data.baths}
                    min={1}
                    max={20}
                    onChange={(n) => setData((p) => ({ ...p, baths: n }))}
                  />
                </div>
                <label className="flex min-h-[44px] items-center justify-between gap-4">
                  <span className="font-medium text-[var(--kama-ink)]">
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
                    className="h-5 w-5 accent-[var(--kama-accent)]"
                  />
                </label>
              </div>
            </div>
          )}

          {step.id === "amenities" && (
            <div>
              <AmenitiesIllustration className="mb-4 h-16 w-full max-w-[160px]" />
              <h1 className="text-2xl font-bold text-[var(--kama-ink)] sm:text-3xl">
                Tell guests what your place offers
              </h1>
              <p className="mt-2 text-sm text-[var(--kama-ink-muted)]">
                Optional — you can add more later.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-3">
                {LISTING_AMENITIES.map((amenity) => {
                  const selected = data.amenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        setData((p) => ({
                          ...p,
                          amenities: selected
                            ? p.amenities.filter((a) => a !== amenity)
                            : [...p.amenities, amenity],
                        }))
                      }
                      className={`wizard-select-card rounded-2xl border-2 px-4 py-4 text-left text-sm font-medium ${
                        selected
                          ? "is-selected border-[var(--kama-ink)]"
                          : "border-[var(--kama-border)]"
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
              <PhotosIllustration className="mb-4 h-24 w-full max-w-[180px]" />
              <h1 className="text-2xl font-bold text-[var(--kama-ink)] sm:text-3xl">
                Add photos of your place
              </h1>
              <p className="mt-2 text-[var(--kama-ink-muted)]">
                You&apos;ll need at least 1 photo. Add more anytime after
                publishing.
              </p>
              <label className="mt-8 flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--kama-border-strong)] bg-[var(--kama-field)] px-6 py-12 transition hover:border-[var(--kama-accent)]">
                <ImagePlus className="h-10 w-10 text-[var(--kama-accent)]" />
                <span className="mt-3 font-semibold text-[var(--kama-ink)]">
                  Add photos
                </span>
                <span className="mt-1 text-xs text-[var(--kama-ink-muted)]">
                  JPG, PNG — multiple allowed
                </span>
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
                <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {imageFiles.map((file, i) => (
                    <li
                      key={`${file.name}-${i}`}
                      className="relative overflow-hidden rounded-xl bg-[var(--kama-field)]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreviews[i]}
                        alt=""
                        className="aspect-[4/3] w-full object-cover"
                      />
                      <button
                        type="button"
                        aria-label={`Remove ${file.name}`}
                        onClick={() =>
                          setImageFiles((prev) =>
                            prev.filter((_, j) => j !== i),
                          )
                        }
                        className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <p className="truncate px-2 py-1.5 text-[11px] text-[var(--kama-ink-muted)]">
                        {file.name}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}

          {step.id === "audio" && (
            <div>
              <AudioIllustration className="mb-4 h-24 w-full max-w-[180px]" />
              <h1 className="text-2xl font-bold text-[var(--kama-ink)] sm:text-3xl">
                Add an audio tour
              </h1>
              <p className="mt-2 text-[var(--kama-ink-muted)]">
                Optional — record a short welcome or walkthrough guests can play
                on the listing. Skip if you prefer.
              </p>
              <div className="mt-8 space-y-4 rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-surface)] p-5">
                <div className="flex flex-wrap items-center gap-3">
                  {!recording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[var(--kama-accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
                    >
                      <Mic className="h-4 w-4" aria-hidden />
                      Start recording
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition animate-pulse"
                    >
                      <Square className="h-4 w-4" aria-hidden />
                      Stop
                    </button>
                  )}
                  <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-[var(--kama-border-strong)] px-4 py-2.5 text-sm font-semibold text-[var(--kama-ink)] transition hover:bg-[var(--kama-field)]">
                    Upload audio file
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setAudioBlob(file);
                        setAudioPreviewUrl((prev) => {
                          if (prev) URL.revokeObjectURL(prev);
                          return URL.createObjectURL(file);
                        });
                      }}
                    />
                  </label>
                </div>
                {audioPreviewUrl ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <audio
                      controls
                      src={audioPreviewUrl}
                      className="w-full max-w-md"
                    />
                    <button
                      type="button"
                      onClick={clearAudio}
                      className="text-sm font-medium text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--kama-ink-muted)]">
                    No audio yet — guests will still see your photos and
                    description.
                  </p>
                )}
              </div>
            </div>
          )}

          {step.id === "title" && (
            <div>
              <TitleIllustration className="mb-4 h-16 w-full max-w-[180px]" />
              <h1 className="text-2xl font-bold text-[var(--kama-ink)] sm:text-3xl">
                Now, let&apos;s give your place a title
              </h1>
              <label className="mt-8 block" htmlFor="wiz-title">
                <span className="mb-1.5 block text-xs font-medium text-[var(--kama-ink-muted)]">
                  Title
                </span>
                <input
                  id="wiz-title"
                  className={`${inputClass} text-lg`}
                  maxLength={50}
                  placeholder="Short catchy title"
                  value={data.name}
                  onChange={(e) =>
                    setData((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </label>
              <p className="mt-1 text-xs text-[var(--kama-ink-muted)]">
                {data.name.length}/50
              </p>
              <label className="mt-6 block" htmlFor="wiz-desc">
                <span className="mb-1.5 block text-xs font-medium text-[var(--kama-ink-muted)]">
                  Description (min 20 characters)
                </span>
                <textarea
                  id="wiz-desc"
                  className={`${inputClass} min-h-[140px] resize-y py-3`}
                  placeholder="Describe what makes your place special for African and international travelers…"
                  value={data.description}
                  onChange={(e) =>
                    setData((p) => ({ ...p, description: e.target.value }))
                  }
                />
              </label>
            </div>
          )}

          {step.id === "pricing" && (
            <div>
              <PricingIllustration className="mx-auto mb-2 h-20 w-20" />
              <h1 className="text-2xl font-bold text-[var(--kama-ink)] sm:text-3xl">
                Set your nightly price
              </h1>
              <p className="mt-2 text-[var(--kama-ink-muted)]">
                Prices are stored in USD. Guests see converted rates.
              </p>
              <div className="mt-8 text-center">
                <span className="text-5xl font-bold text-[var(--kama-ink)]">
                  ${Number(data.rates.nightly) || 0}
                </span>
                <span className="text-[var(--kama-ink-muted)]"> / night</span>
              </div>
              <label className="mt-6 block">
                <span className="sr-only">Nightly price</span>
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
                  className="w-full accent-[var(--kama-accent)]"
                />
              </label>
              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[var(--kama-ink)]">
                    Weekend premium
                  </span>
                  <span className="text-sm text-[var(--kama-ink-muted)]">
                    {data.rates.weekendPremium}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50}
                  aria-label="Weekend premium percent"
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
                  className="mt-2 w-full accent-[var(--kama-accent)]"
                />
                {weekendNightly ? (
                  <p className="mt-2 text-sm text-[var(--kama-ink-muted)]">
                    Fri–Sat guest price:{" "}
                    <strong className="text-[var(--kama-ink)]">
                      ${weekendNightly}/night
                    </strong>
                  </p>
                ) : null}
              </div>
            </div>
          )}

          {step.id === "publish" && (
            <div>
              <PublishIllustration className="mx-auto mb-4 h-28 w-full max-w-[200px]" />
              <h1 className="text-2xl font-bold text-[var(--kama-ink)] sm:text-3xl">
                Ready to publish?
              </h1>
              <div className="mt-8 space-y-4 rounded-2xl border border-[var(--kama-border)] bg-[var(--kama-field)] p-5 text-sm text-[var(--kama-ink)]">
                <p>
                  <strong>Type:</strong> {data.type} ·{" "}
                  {data.listing.privacyType?.replace(/_/g, " ")}
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
                {data.amenities.length ? (
                  <p>
                    <strong>Amenities:</strong> {data.amenities.join(", ")}
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer
        className="sticky bottom-0 z-[80] border-t border-[var(--kama-border)] bg-[var(--kama-surface)]/95 px-4 py-4 backdrop-blur-md sm:px-6"
        style={{
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
          paddingLeft: "max(1rem, env(safe-area-inset-left))",
        }}
      >
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
          <button
            type="button"
            onClick={goBack}
            disabled={stepIndex === 0}
            className="relative z-[1] flex min-h-[44px] min-w-[4.5rem] items-center gap-1 pl-1 text-sm font-semibold text-[var(--kama-ink)] disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          {step.id === "publish" ? (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="kama-cta min-h-[48px] rounded-full px-8 py-3 text-sm font-bold disabled:opacity-50"
            >
              {submitting ? "Publishing…" : "Create listing"}
            </button>
          ) : (
            <button
              type="button"
              disabled={!nextEnabled}
              onClick={goNext}
              className="min-h-[48px] rounded-full bg-[var(--kama-ink)] px-8 py-3 text-sm font-bold text-white transition enabled:hover:bg-[var(--kama-accent)] disabled:bg-[var(--kama-border-strong)] disabled:text-white/70"
            >
              {resolvingPin ? "…" : "Next"}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
