"use client";

import Image from "next/image";
import Link from "next/link";
import KamaLogoTeal from "@/assets/images/Kama logo - teal.svg";

/**
 * Platform brand mark — deep ocean teal (#1B5C57) to match the home portal system.
 */
export default function BrandLogo({
  href = "/",
  className = "h-10 w-auto",
  priority = false,
  linkClassName = "shrink-0 inline-flex items-center",
  alt = "Isisel",
}) {
  const img = (
    <Image
      src={KamaLogoTeal}
      alt={alt}
      className={`object-contain ${className}`}
      width={120}
      height={40}
      priority={priority}
    />
  );

  if (!href) return img;

  return (
    <Link href={href} className={linkClassName} aria-label={alt}>
      {img}
    </Link>
  );
}
