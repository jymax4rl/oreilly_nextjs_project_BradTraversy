"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";

/**
 * Listing thumbnail with client-side broken-image fallback.
 * Server Components cannot pass onError handlers to <img>.
 */
export default function PropertyListingThumbnail({ src, alt, className = "" }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-gray-100 ${className}`}
      >
        <Building2 className="h-8 w-8 text-gray-300" aria-hidden />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote listing URLs; avoid next/image domain config
    <img
      src={src}
      alt={alt}
      className={`h-full w-full object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
