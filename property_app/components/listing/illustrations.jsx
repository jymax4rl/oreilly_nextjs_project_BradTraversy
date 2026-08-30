/** Hand-crafted SVG illustrations for the list-property wizard (Kama teal). */

const teal = "var(--kama-accent, #1B5C57)";
const soft = "var(--kama-accent-soft, rgba(27,92,87,0.12))";
const muted = "var(--kama-ink-muted, #4a5c5b)";

export function IntroIllustration({ className = "" }) {
  return (
    <svg
      className={`wizard-float ${className}`}
      viewBox="0 0 280 180"
      fill="none"
      aria-hidden
    >
      <ellipse cx="140" cy="158" rx="90" ry="10" fill={soft} />
      <rect x="40" y="70" width="70" height="70" rx="8" fill={soft} stroke={teal} strokeWidth="1.5" />
      <path d="M40 90h70M55 70v70M80 70v70" stroke={teal} strokeWidth="1" opacity="0.35" />
      <path d="M75 55l-40 20h80L75 55z" fill={teal} opacity="0.85" />
      <rect x="150" y="50" width="80" height="90" rx="10" fill="#fff" stroke={teal} strokeWidth="1.5" />
      <rect x="162" y="66" width="56" height="8" rx="2" fill={soft} />
      <rect x="162" y="82" width="40" height="6" rx="2" fill={soft} />
      <rect x="162" y="96" width="48" height="6" rx="2" fill={soft} />
      <circle cx="210" cy="120" r="14" fill={teal} />
      <path d="M204 120h12M210 114v12" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M95 120c20-28 50-28 70 0"
        stroke={teal}
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity="0.5"
      />
    </svg>
  );
}

export function PropertyTypeArt({ typeId, className = "h-10 w-10" }) {
  const common = { className, viewBox: "0 0 48 48", fill: "none", "aria-hidden": true };
  switch (typeId) {
    case "House":
      return (
        <svg {...common}>
          <path d="M8 22L24 8l16 14v18a2 2 0 01-2 2H10a2 2 0 01-2-2V22z" fill={soft} stroke={teal} strokeWidth="1.6" />
          <rect x="20" y="28" width="8" height="12" rx="1" fill={teal} />
          <rect x="12" y="24" width="7" height="7" rx="1" fill="#fff" stroke={teal} strokeWidth="1.2" />
          <rect x="29" y="24" width="7" height="7" rx="1" fill="#fff" stroke={teal} strokeWidth="1.2" />
        </svg>
      );
    case "Apartment":
      return (
        <svg {...common}>
          <rect x="12" y="6" width="24" height="36" rx="3" fill={soft} stroke={teal} strokeWidth="1.6" />
          <rect x="16" y="12" width="5" height="5" rx="0.8" fill="#fff" stroke={teal} strokeWidth="1" />
          <rect x="24" y="12" width="5" height="5" rx="0.8" fill="#fff" stroke={teal} strokeWidth="1" />
          <rect x="32" y="12" width="5" height="5" rx="0.8" fill="#fff" stroke={teal} strokeWidth="1" />
          <rect x="16" y="22" width="5" height="5" rx="0.8" fill="#fff" stroke={teal} strokeWidth="1" />
          <rect x="24" y="22" width="5" height="5" rx="0.8" fill="#fff" stroke={teal} strokeWidth="1" />
          <rect x="32" y="22" width="5" height="5" rx="0.8" fill="#fff" stroke={teal} strokeWidth="1" />
          <rect x="16" y="32" width="5" height="5" rx="0.8" fill="#fff" stroke={teal} strokeWidth="1" />
          <rect x="24" y="32" width="5" height="5" rx="0.8" fill="#fff" stroke={teal} strokeWidth="1" />
          <rect x="32" y="32" width="5" height="5" rx="0.8" fill="#fff" stroke={teal} strokeWidth="1" />
        </svg>
      );
    case "Condo":
      return (
        <svg {...common}>
          <rect x="8" y="14" width="18" height="28" rx="2" fill={soft} stroke={teal} strokeWidth="1.5" />
          <rect x="22" y="8" width="18" height="34" rx="2" fill="#fff" stroke={teal} strokeWidth="1.5" />
          <path d="M26 18h10M26 24h10M26 30h10" stroke={teal} strokeWidth="1.2" opacity="0.5" />
        </svg>
      );
    case "Cabin or Cottage":
      return (
        <svg {...common}>
          <path d="M6 28L24 10l18 18" stroke={teal} strokeWidth="1.6" />
          <path d="M10 28h28v12H10V28z" fill={soft} stroke={teal} strokeWidth="1.5" />
          <rect x="21" y="32" width="6" height="8" fill={teal} />
          <circle cx="14" cy="18" r="3" fill={teal} opacity="0.35" />
        </svg>
      );
    case "Room":
      return (
        <svg {...common}>
          <rect x="6" y="12" width="36" height="28" rx="3" fill={soft} stroke={teal} strokeWidth="1.5" />
          <rect x="10" y="24" width="16" height="10" rx="2" fill="#fff" stroke={teal} strokeWidth="1.2" />
          <circle cx="34" cy="20" r="4" fill={teal} opacity="0.4" />
          <path d="M28 36h12" stroke={teal} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "Studio":
      return (
        <svg {...common}>
          <rect x="8" y="10" width="32" height="30" rx="4" fill={soft} stroke={teal} strokeWidth="1.5" />
          <rect x="12" y="28" width="12" height="8" rx="1.5" fill="#fff" stroke={teal} strokeWidth="1.2" />
          <rect x="28" y="16" width="8" height="12" rx="1" fill="#fff" stroke={teal} strokeWidth="1.2" />
          <circle cx="18" cy="18" r="3" fill={teal} opacity="0.35" />
        </svg>
      );
    case "Loft":
      return (
        <svg {...common}>
          <path d="M8 38V18l16-10 16 10v20" fill={soft} stroke={teal} strokeWidth="1.5" />
          <path d="M14 38V26h20v12" stroke={teal} strokeWidth="1.3" />
          <path d="M18 26v-6M24 26v-8M30 26v-6" stroke={teal} strokeWidth="1.2" opacity="0.45" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <rect x="10" y="14" width="28" height="24" rx="4" fill={soft} stroke={teal} strokeWidth="1.5" />
          <path d="M18 26h12M24 20v12" stroke={teal} strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
  }
}

export function PrivacyArt({ privacyId, className = "h-12 w-12 shrink-0" }) {
  const common = { className, viewBox: "0 0 56 56", fill: "none", "aria-hidden": true };
  if (privacyId === "entire_place") {
    return (
      <svg {...common}>
        <rect x="10" y="18" width="36" height="28" rx="4" fill={soft} stroke={teal} strokeWidth="1.5" />
        <path d="M10 28h36" stroke={teal} strokeWidth="1" opacity="0.3" />
        <circle cx="28" cy="14" r="6" fill={teal} opacity="0.85" />
        <path d="M28 20v6" stroke={teal} strokeWidth="1.5" />
      </svg>
    );
  }
  if (privacyId === "private_room") {
    return (
      <svg {...common}>
        <rect x="8" y="14" width="40" height="32" rx="4" fill={soft} stroke={teal} strokeWidth="1.4" />
        <rect x="12" y="20" width="18" height="22" rx="2" fill="#fff" stroke={teal} strokeWidth="1.4" />
        <circle cx="38" cy="28" r="5" fill={teal} opacity="0.35" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect x="8" y="16" width="40" height="28" rx="4" fill={soft} stroke={teal} strokeWidth="1.4" />
      <circle cx="22" cy="30" r="5" fill={teal} opacity="0.5" />
      <circle cx="34" cy="30" r="5" fill={teal} opacity="0.85" />
    </svg>
  );
}

export function LocationIllustration({ className = "" }) {
  return (
    <svg className={`wizard-float ${className}`} viewBox="0 0 200 120" fill="none" aria-hidden>
      <ellipse cx="100" cy="100" rx="60" ry="8" fill={soft} />
      <path
        d="M100 20c-18 0-32 14-32 32 0 24 32 48 32 48s32-24 32-48c0-18-14-32-32-32z"
        fill={soft}
        stroke={teal}
        strokeWidth="1.6"
      />
      <circle cx="100" cy="50" r="10" fill={teal} />
      <path d="M40 88h120" stroke={muted} strokeWidth="1" opacity="0.25" strokeDasharray="3 4" />
    </svg>
  );
}

export function BasicsIllustration({ className = "" }) {
  return (
    <svg className={`wizard-float-slow ${className}`} viewBox="0 0 160 100" fill="none" aria-hidden>
      <rect x="20" y="30" width="40" height="36" rx="6" fill={soft} stroke={teal} strokeWidth="1.4" />
      <rect x="70" y="22" width="40" height="44" rx="6" fill="#fff" stroke={teal} strokeWidth="1.4" />
      <rect x="120" y="34" width="28" height="32" rx="6" fill={soft} stroke={teal} strokeWidth="1.4" />
      <circle cx="40" cy="48" r="6" fill={teal} opacity="0.5" />
      <circle cx="90" cy="44" r="7" fill={teal} />
      <circle cx="134" cy="50" r="5" fill={teal} opacity="0.4" />
    </svg>
  );
}

export function AmenitiesIllustration({ className = "" }) {
  return (
    <svg className={`wizard-float ${className}`} viewBox="0 0 160 90" fill="none" aria-hidden>
      <rect x="16" y="24" width="36" height="36" rx="10" fill={soft} stroke={teal} strokeWidth="1.3" />
      <rect x="62" y="24" width="36" height="36" rx="10" fill="#fff" stroke={teal} strokeWidth="1.3" />
      <rect x="108" y="24" width="36" height="36" rx="10" fill={soft} stroke={teal} strokeWidth="1.3" />
      <path d="M28 42h12M34 36v12" stroke={teal} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="80" cy="42" r="8" stroke={teal} strokeWidth="1.4" />
      <path d="M120 36c6 0 10 4 10 8s-4 8-10 8-10-4-10-8 4-8 10-8z" stroke={teal} strokeWidth="1.3" />
    </svg>
  );
}

export function PhotosIllustration({ className = "" }) {
  return (
    <svg className={`wizard-float-slow ${className}`} viewBox="0 0 180 110" fill="none" aria-hidden>
      <rect x="30" y="20" width="100" height="70" rx="8" fill={soft} stroke={teal} strokeWidth="1.5" transform="rotate(-6 80 55)" />
      <rect x="50" y="28" width="100" height="70" rx="8" fill="#fff" stroke={teal} strokeWidth="1.5" />
      <circle cx="78" cy="55" r="12" stroke={teal} strokeWidth="1.4" />
      <path d="M70 78h60" stroke={teal} strokeWidth="1.2" opacity="0.4" />
    </svg>
  );
}

export function AudioIllustration({ className = "" }) {
  return (
    <svg className={`wizard-float ${className}`} viewBox="0 0 180 110" fill="none" aria-hidden>
      <ellipse cx="90" cy="92" rx="48" ry="8" fill={soft} />
      <circle cx="90" cy="52" r="34" fill={soft} stroke={teal} strokeWidth="1.5" />
      <rect x="78" y="36" width="24" height="36" rx="12" fill={teal} opacity="0.85" />
      <path
        d="M66 52v4a24 24 0 0048 0v-4"
        stroke={teal}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M90 80v10" stroke={teal} strokeWidth="2" strokeLinecap="round" />
      <path d="M78 90h24" stroke={teal} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function TitleIllustration({ className = "" }) {
  return (
    <svg className={`wizard-float ${className}`} viewBox="0 0 180 80" fill="none" aria-hidden>
      <rect x="24" y="18" width="132" height="48" rx="10" fill={soft} stroke={teal} strokeWidth="1.4" />
      <path d="M40 36h100M40 48h70" stroke={teal} strokeWidth="2" strokeLinecap="round" opacity="0.45" />
    </svg>
  );
}

export function PricingIllustration({ className = "" }) {
  return (
    <svg className={`wizard-float-slow ${className}`} viewBox="0 0 160 100" fill="none" aria-hidden>
      <circle cx="80" cy="48" r="32" fill={soft} stroke={teal} strokeWidth="1.6" />
      <text x="80" y="56" textAnchor="middle" fill={teal} fontSize="28" fontWeight="700" fontFamily="system-ui,sans-serif">
        $
      </text>
    </svg>
  );
}

export function PublishIllustration({ className = "" }) {
  return (
    <svg className={`wizard-float ${className}`} viewBox="0 0 200 120" fill="none" aria-hidden>
      <rect x="50" y="24" width="100" height="72" rx="12" fill={soft} stroke={teal} strokeWidth="1.5" />
      <path d="M78 62l14 14 30-34" stroke={teal} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="160" cy="36" r="10" fill={teal} opacity="0.2" className="wizard-pulse" />
    </svg>
  );
}

export function StepBadge({ n }) {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--kama-accent-soft)] text-sm font-bold text-[var(--kama-accent)]"
      aria-hidden
    >
      {n}
    </span>
  );
}
