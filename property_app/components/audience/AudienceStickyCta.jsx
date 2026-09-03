"use client";

import Link from "next/link";
import { useScrollNav } from "@/contexts/ScrollNavContext";

export default function AudienceStickyCta({ href, label }) {
  const { bottomChromeVisible } = useScrollNav();
  const external = href.startsWith("mailto:") || href.startsWith("http");

  return (
    <div
      className={`audience-sticky${bottomChromeVisible ? " is-on" : ""}`}
      aria-hidden={!bottomChromeVisible}
    >
      {external ? (
        <a className="audience-btn audience-btn--accent" href={href}>
          {label}
        </a>
      ) : (
        <Link className="audience-btn audience-btn--accent" href={href}>
          {label}
        </Link>
      )}
    </div>
  );
}
