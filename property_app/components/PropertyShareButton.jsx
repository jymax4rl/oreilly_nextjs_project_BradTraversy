"use client";

import { useState } from "react";
import { Check, Share } from "lucide-react";
import { propertyPublicPath } from "@/utils/listings/propertyPath";
import { useLanguage } from "@/components/i18n/LanguageProvider";

function resolveShareUrl(property, url) {
  if (url) return url;
  if (typeof window === "undefined") return "";
  if (property) {
    return `${window.location.origin}${propertyPublicPath(property)}`;
  }
  return window.location.href;
}

export default function PropertyShareButton({
  property,
  title,
  url,
  variant = "text",
  className = "",
}) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleShare(event) {
    event.preventDefault();
    event.stopPropagation();

    const shareUrl = resolveShareUrl(property, url);
    const shareTitle = title || property?.name || "Kama Properties";
    const shareText = t("listing.shareText", { title: shareTitle });

    setBusy(true);
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share({
            title: shareTitle,
            text: shareText,
            url: shareUrl,
          });
          return;
        } catch (error) {
          if (error?.name === "AbortError") return;
        }
      }

      if (navigator.clipboard?.writeText && shareUrl) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } finally {
      setBusy(false);
    }
  }

  const label = copied ? t("listing.copied") : t("listing.share");

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleShare}
        disabled={busy}
        aria-label={copied ? t("listing.linkCopied") : t("listing.shareStay")}
        className={`absolute z-20 cursor-pointer rounded-full bg-black/55 p-2.5 text-white backdrop-blur-md transition-colors duration-200 hover:bg-black/70 focus:outline-none disabled:opacity-50 ${className}`}
      >
        {copied ? (
          <Check size={18} strokeWidth={2.5} aria-hidden />
        ) : (
          <Share size={18} strokeWidth={2} aria-hidden />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={busy}
      aria-label={copied ? t("listing.linkCopied") : t("listing.shareStay")}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--kama-border)] bg-[var(--kama-surface)] px-3 py-2 text-sm font-medium text-[var(--kama-ink)] transition hover:border-[var(--kama-border-strong)] hover:bg-[var(--kama-field)] disabled:opacity-50 ${className}`}
    >
      {copied ? (
        <Check size={16} strokeWidth={2.5} aria-hidden />
      ) : (
        <Share size={16} strokeWidth={2} aria-hidden />
      )}
      <span>{label}</span>
    </button>
  );
}
