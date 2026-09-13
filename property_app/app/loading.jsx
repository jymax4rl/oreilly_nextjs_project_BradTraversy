import Image from "next/image";

/**
 * Route loading — same brand language as the PWA boot veil.
 * No indigo spinner; the mark is the only loading signal.
 */
export default function Loading() {
  return (
    <div
      className="kama-route-loading"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="kama-route-loading__glow" aria-hidden />
      <Image
        src="/brand/isisel-logo.svg"
        alt=""
        width={140}
        height={48}
        priority
        className="kama-route-loading__logo"
      />
      <span className="kama-route-loading__line" aria-hidden />
      <span className="sr-only">Loading</span>
    </div>
  );
}
