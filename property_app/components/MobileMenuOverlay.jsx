"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { getLoginUrl } from "@/lib/legal/loginUrl";
import {
  Home,
  Building2,
  PlusCircle,
  LayoutList,
  Shield,
  Heart,
  Settings,
  LogOut,
  MessageSquare,
  CalendarCheck,
  ChevronRight,
  X,
} from "lucide-react";
import { LuUserRound } from "react-icons/lu";
import BrandLogo from "@/components/BrandLogo";
import { BECOME_A_HOST_HREF } from "@/utils/hostPwaInstall";
import Currency from "@/components/Currency";
import { isOpsStaff } from "@/utils/opsAuth";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import LanguageToggle from "@/components/i18n/LanguageToggle";

/**
 * Full-screen mobile navigation overlay.
 * Identity first when signed in; sections are role-aware (guest / host / admin).
 */
export default function MobileMenuOverlay({
  isOpen,
  close,
  session,
  unreadCount = 0,
}) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const user = session?.user;
  const isHost = user?.hostStatus === "verified";
  const isAdmin = isOpsStaff(user?.role);
  const profileImage = user?.image;

  const isActive = (path) => {
    if (path === "/") return pathname === "/";
    if (path === "/properties") {
      return (
        pathname === "/properties" ||
        (pathname.startsWith("/properties/") &&
          !pathname.startsWith("/properties/add") &&
          !pathname.startsWith("/properties/my-listings"))
      );
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const rowClass = (path) =>
    `kama-menu-row${isActive(path) ? " kama-menu-row--active" : ""}`;

  return (
    <div
      className={`overlay-wrapper w-screen ${isOpen ? "is-open" : ""}`}
      aria-hidden={!isOpen}
    >
      <div className="kama-menu-shell">
        <div className="kama-menu-panel">
          {/* Header */}
          <header className="kama-menu-header">
            <BrandLogo className="h-9 w-auto" href="/" />
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <div className="kama-menu-currency-chip">
                <Currency variant="portal" align="end" />
              </div>
              <button
                type="button"
                onClick={close}
                className="kama-menu-close"
                aria-label={t("menu.close")}
              >
                <X className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </button>
            </div>
          </header>

          <div className="kama-menu-scroll">
            <div className="mx-auto w-full max-w-md">
              {/* Identity / Sign-in — always first */}
              {user ? (
                <Link
                  href="/profile"
                  onClick={close}
                  className="kama-menu-identity"
                  aria-label="View profile"
                >
                  {profileImage ? (
                    <Image
                      src={profileImage}
                      alt=""
                      width={52}
                      height={52}
                      className="h-[3.25rem] w-[3.25rem] shrink-0 rounded-full object-cover ring-2 ring-[rgba(27,92,87,0.18)]"
                    />
                  ) : (
                    <div
                      className="flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-full bg-[#1b5c57] text-lg font-semibold text-white"
                      aria-hidden
                    >
                      {user.name?.charAt(0)?.toUpperCase() || (
                        <LuUserRound className="h-6 w-6" />
                      )}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.95rem] font-semibold tracking-tight text-[#0c1a1a]">
                      {user.name || t("menu.yourProfile")}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-[#4a5c5b]">
                      {user.email}
                    </p>
                  </div>
                  <ChevronRight
                    className="h-5 w-5 shrink-0 text-[#7a8c8b]"
                    aria-hidden
                  />
                </Link>
              ) : (
                <div className="kama-menu-signin-block">
                  <p className="text-[0.95rem] font-semibold tracking-tight text-[#0c1a1a]">
                    {t("menu.welcome")}
                  </p>
                  <p className="mt-1 text-sm leading-snug text-[#4a5c5b]">
                    {t("menu.signInHint")}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      window.location.assign(getLoginUrl(pathname || "/"));
                    }}
                    className="kama-menu-cta mt-4"
                  >
                    <GoogleGlyph />
                    {t("menu.signInGoogle")}
                  </button>
                </div>
              )}

              {/* Discover */}
              <section className="kama-menu-group" aria-labelledby="menu-discover">
                <p id="menu-discover" className="kama-menu-section">
                  {t("menu.discover")}
                </p>
                <nav className="flex flex-col gap-0.5" aria-label={t("menu.discover")}>
                  <Link href="/" onClick={close} className={rowClass("/")}>
                    <Home className="kama-menu-row-icon" aria-hidden />
                    {t("nav.home")}
                  </Link>
                  <Link
                    href="/properties"
                    onClick={close}
                    className={rowClass("/properties")}
                  >
                    <Building2 className="kama-menu-row-icon" aria-hidden />
                    {t("nav.properties")}
                  </Link>
                  <Link
                    href="/saved-properties"
                    onClick={close}
                    className={rowClass("/saved-properties")}
                  >
                    <Heart className="kama-menu-row-icon" aria-hidden />
                    {t("menu.saved")}
                  </Link>
                  <Link
                    href="/policies"
                    onClick={close}
                    className={rowClass("/policies")}
                  >
                    <Shield className="kama-menu-row-icon" aria-hidden />
                    {t("nav.policies")}
                  </Link>
                </nav>
              </section>

              {/* Travel — signed-in guests */}
              {user && (
                <section className="kama-menu-group" aria-labelledby="menu-travel">
                  <p id="menu-travel" className="kama-menu-section">
                    {t("menu.travel")}
                  </p>
                  <nav className="flex flex-col gap-0.5" aria-label={t("menu.travel")}>
                    <Link
                      href="/my-bookings"
                      onClick={close}
                      className={rowClass("/my-bookings")}
                    >
                      <CalendarCheck
                        className="kama-menu-row-icon"
                        aria-hidden
                      />
                      {t("menu.myBookings")}
                    </Link>
                    <Link
                      href="/messages"
                      onClick={close}
                      className={rowClass("/messages")}
                    >
                      <MessageSquare
                        className="kama-menu-row-icon"
                        aria-hidden
                      />
                      {t("nav.messages")}
                      {unreadCount > 0 && (
                        <span className="kama-menu-badge">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </Link>
                  </nav>
                </section>
              )}

              {/* Hosting — visitors and guests apply; verified hosts get tools */}
              <section
                className="kama-menu-group"
                aria-labelledby="menu-hosting"
              >
                <p id="menu-hosting" className="kama-menu-section">
                  {t("menu.hosting")}
                </p>
                <nav className="flex flex-col gap-0.5" aria-label={t("menu.hosting")}>
                    {isHost ? (
                      <Link
                        href="/host"
                        onClick={close}
                        className={`${rowClass("/host")} kama-menu-row--accent`}
                      >
                        <LayoutList
                          className="kama-menu-row-icon"
                          aria-hidden
                        />
                        {t("nav.hostConsole")}
                      </Link>
                    ) : (
                    <Link
                      href={BECOME_A_HOST_HREF}
                      onClick={close}
                      className={`${rowClass("/host/install")} kama-menu-row--accent`}
                    >
                      <PlusCircle
                        className="kama-menu-row-icon"
                        aria-hidden
                      />
                      {t("menu.becomeHost")}
                    </Link>
                    )}
                    <Link
                      href="/business"
                      onClick={close}
                      className={rowClass("/business")}
                    >
                      <Building2
                        className="kama-menu-row-icon"
                        aria-hidden
                      />
                      {t("nav.business")}
                    </Link>
                </nav>
              </section>

              {/* Ops */}
              {isAdmin && (
                <section className="kama-menu-group" aria-labelledby="menu-admin">
                  <p id="menu-admin" className="kama-menu-section">
                    {t("nav.operations")}
                  </p>
                  <nav className="flex flex-col gap-0.5" aria-label={t("nav.operations")}>
                    <Link
                      href="/ops"
                      onClick={close}
                      className={rowClass("/ops")}
                    >
                      <Shield className="kama-menu-row-icon" aria-hidden />
                      {t("menu.opsConsole")}
                    </Link>
                  </nav>
                </section>
              )}

              {/* Account */}
              {user && (
                <section
                  className="kama-menu-group"
                  aria-labelledby="menu-account"
                >
                  <p id="menu-account" className="kama-menu-section">
                    {t("menu.account")}
                  </p>
                  <nav className="flex flex-col gap-0.5" aria-label={t("menu.account")}>
                    <Link
                      href="/settings"
                      onClick={close}
                      className={rowClass("/settings")}
                    >
                      <Settings className="kama-menu-row-icon" aria-hidden />
                      {t("nav.settings")}
                    </Link>
                    <Link
                      href="/policies"
                      onClick={close}
                      className={rowClass("/policies")}
                    >
                      <Shield className="kama-menu-row-icon" aria-hidden />
                      {t("nav.policies")}
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        close();
                        signOut();
                      }}
                      className="kama-menu-signout"
                    >
                      <LogOut className="h-5 w-5 shrink-0" aria-hidden />
                      {t("nav.signOut")}
                    </button>
                  </nav>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 262"
      className="h-5 w-5 shrink-0"
      aria-hidden
    >
      <path
        fill="#4285F4"
        d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
      />
      <path
        fill="#34A853"
        d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
      />
      <path
        fill="#FBBC05"
        d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
      />
      <path
        fill="#EB4335"
        d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
      />
    </svg>
  );
}
