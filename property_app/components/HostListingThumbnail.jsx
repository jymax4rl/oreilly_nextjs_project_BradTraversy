"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";

/**
 * Client-only thumbnail so onError can hide a broken image.
 * Must not live in a Server Component — RSC cannot serialize event handlers.
 */
export default function HostListingThumbnail({ src, alt }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Building2 className="h-8 w-8 text-gray-300" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}
