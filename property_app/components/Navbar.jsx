"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Hamburger from "@/components/hamburger";
import "./navbar.css";
import gsap from "gsap";
import NavButton from "./NavButton";
import BrandLogo from "@/components/BrandLogo";
import MobileMenuOverlay from "@/components/MobileMenuOverlay";
import { LuUserRound } from "react-icons/lu";
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
} from "lucide-react";
import LoginNavButton from "./LoginNavBtn";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { getUnreadMessageCount } from "@/utils/actions/messageActions";
import { useMenuOverlay } from "@/contexts/MenuOverlayContext";
import { isExploreMobileLayout } from "@/utils/exploreLayout";
import { isFullscreenRoute } from "@/utils/fullscreenRoutes";
import { getLoginUrl } from "@/lib/legal/loginUrl";
import { isOpsStaff } from "@/utils/opsAuth";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import LanguageToggle from "@/components/i18n/LanguageToggle";

const navLinks = [
  { path: "/", labelKey: "nav.home", Icon: Home },
  { path: "/properties", labelKey: "nav.properties", Icon: Building2 },
];

const profileItemClass = "kama-profile-item font-medium";

const Navbar = () => {
  const { data: session } = useSession();
  const { t } = useLanguage();
  const { isOpen, toggle, close } = useMenuOverlay();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const profileImage = session?.user?.image;
  const explore = isExploreMobileLayout(pathname);

  useEffect(() => {
    if (!session?.user) return;
    getUnreadMessageCount().then(setUnreadCount).catch(() => {});
  }, [session, pathname]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const profileMenu = document.getElementById("profile-menu");
      const profileTrigger = document.getElementById("profile-trigger");
      if (
        profileMenu &&
        !profileMenu.contains(event.target) &&
        profileTrigger &&
        !profileTrigger.contains(event.target)
      ) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const closeMenuAnimation = () => {
    gsap.to(".overlay-wrapper", {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
      duration: 0.85,
      ease: "power4.inOut",
    });
  };

  const openMenuAnimation = () => {
    gsap.to(".overlay-wrapper", {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      duration: 0.85,
      ease: "power4.inOut",
    });
  };

  const toggleProfileMenu = () => {
    setIsProfileOpen((prev) => !prev);
  };

  useEffect(() => {
    if (isOpen) {
      openMenuAnimation();
    } else {
      closeMenuAnimation();
    }
  }, [isOpen]);

  // Close menus on route change
  useEffect(() => {
    close();
    setIsProfileOpen(false);
  }, [pathname, close]);

  const isActive = (path) => pathname === path;

  const getHostNavItem = () => {
    if (session?.user?.hostStatus === "verified") {
      return { path: "/host", label: t("nav.hostConsole") };
    }
    return { path: "/host/onboarding", label: t("nav.becomeHost") };
  };

  const hostNavItem = getHostNavItem();

  if (isFullscreenRoute(pathname)) {
    return null;
  }

  return (
    <div>
      {!explore && (
        <nav
          className={`menu-container m-0 grid grid-cols-2 z-50 fixed top-0 w-screen h-[8vh] lg:hidden ${
            isHome ? "home-glass-nav" : "bg-[var(--kama-canvas)]/80 backdrop-blur-sm"
          }`}
        >
          <div className="flex items-center ml-4 justify-start align-center">
            <BrandLogo
              className="h-10 w-24 cursor-pointer transition-all duration-300 hover:scale-105"
              priority={isHome}
            />
          </div>
          <div className="flex w-full items-center justify-end pointer mr-4">
            <Hamburger clickFunc={toggle} checked={isOpen} />
          </div>
        </nav>
      )}

      <nav
        className={`menu-container m-0 hidden lg:grid grid-cols-[20%_60%_20%] z-50 fixed top-0 w-screen h-[8vh] ${
          isHome
            ? "home-glass-nav home-glass-nav--desktop"
            : "bg-[var(--kama-canvas)]/80 backdrop-blur-sm"
        }`}
      >
        <div className="flex items-center ml-4 lg:ml-22 justify-start align-center">
          <BrandLogo
            className="h-10 w-24 cursor-pointer transition-all duration-300 hover:scale-105 lg:h-12 lg:w-32"
            priority={isHome}
          />
        </div>

        {/* Desktop Navigation */}
        <div className="flex space-x-12 p-2 items-center justify-center">
          {navLinks.map((link, index) => (
            <Link
              key={index}
              href={link.path}
              className={
                isHome || !isActive(link.path) ? "p-2 text-black" : "p-2 text-white"
              }
            >
              <NavButton text={t(link.labelKey)} />
            </Link>
          ))}

          {hostNavItem && (
            <Link
              href={hostNavItem.path}
              className={
                isHome || !isActive(hostNavItem.path)
                  ? "p-2 text-black"
                  : "p-2 text-white"
              }
            >
              <NavButton text={hostNavItem.label} />
            </Link>
          )}

          {isOpsStaff(session?.user?.role) && (
            <Link
              href="/ops"
              className={
                isHome || !isActive("/ops")
                  ? "p-2 text-black"
                  : "p-2 text-white"
              }
            >
              <NavButton text={t("nav.ops")} />
            </Link>
          )}
        </div>

        {/* Right Section */}
        <div className="flex w-full gap-3 lg:gap-6 items-center justify-end pointer mr-4">
          <LanguageToggle
            className={
              isHome
                ? "hidden lg:inline-flex !border-[rgba(247,244,238,0.28)] !bg-transparent !shadow-none !backdrop-blur-none"
                : "hidden lg:inline-flex"
            }
          />
          {!session && (
            <div className="hidden lg:block">
              {isHome ? (
                <button
                  type="button"
                  className="home-nav-signin"
                  onClick={() => {
                    window.location.assign(getLoginUrl(pathname || "/"));
                  }}
                >
                  {t("nav.signIn")}
                </button>
              ) : (
                <LoginNavButton
                  label={t("nav.signIn")}
                  onClick={() => {
                    window.location.assign(getLoginUrl(pathname || "/"));
                  }}
                />
              )}
            </div>
          )}

          {session && (
            <div className="relative hidden lg:block">
              <button
                id="profile-trigger"
                onClick={toggleProfileMenu}
                className="flex items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1b5c57]/40"
                aria-expanded={isProfileOpen}
                aria-haspopup="true"
              >
                {profileImage ? (
                  <Image
                    src={profileImage}
                    alt="Profile"
                    width={40}
                    height={40}
                    className="rounded-full cursor-pointer object-cover ring-2 ring-[#1b5c57]/15"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <LuUserRound
                    className={`cursor-pointer w-8 h-8 transition-all duration-200 ${
                      isHome
                        ? "text-[#f7f4ee]/90 hover:text-[#e8d7b5] drop-shadow"
                        : "text-[#0c1a1a]/70 hover:text-[#1b5c57]"
                    }`}
                  />
                )}
              </button>

              <div
                id="profile-menu"
                className={`kama-profile-menu absolute right-0 top-full mr-6 mt-3 w-[15em] origin-top-right rounded-xl border p-2 ring-1 ring-black/5 focus:outline-none transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] z-50 ${
                  isProfileOpen
                    ? "opacity-100 visible scale-100"
                    : "opacity-0 invisible scale-95"
                }`}
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="profile-trigger"
              >
                <div className="mb-2 border-b border-[rgba(12,26,26,0.08)] px-3 py-3">
                  <p className="text-sm font-medium text-[#0c1a1a]">
                    {session.user.name || "User"}
                  </p>
                  <p className="mt-0.5 truncate text-xs font-normal text-[#4a5c5b]">
                    {session.user.email}
                  </p>
                </div>

                <div className="space-y-0.5">
                  <Link
                    href="/profile"
                    className={profileItemClass}
                    role="menuitem"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <LuUserRound />
                    <span>{t("nav.profile")}</span>
                  </Link>

                  <Link
                    href="/saved-properties"
                    className={profileItemClass}
                    role="menuitem"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <Heart />
                    <span>{t("nav.saved")}</span>
                  </Link>

                  <Link
                    href="/my-bookings"
                    className={profileItemClass}
                    role="menuitem"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <CalendarCheck />
                    <span>{t("nav.bookings")}</span>
                  </Link>

                  <Link
                    href="/messages"
                    className={profileItemClass}
                    role="menuitem"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <MessageSquare />
                    <span>{t("nav.messages")}</span>
                    {unreadCount > 0 && (
                      <span className="ml-auto flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#1b5c57] px-1 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/settings"
                    className={profileItemClass}
                    role="menuitem"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <Settings />
                    <span>{t("nav.settings")}</span>
                  </Link>

                  <Link
                    href="/policies"
                    className={profileItemClass}
                    role="menuitem"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <Shield />
                    <span>{t("nav.policies")}</span>
                  </Link>
                </div>

                <div className="my-2 h-px bg-[rgba(12,26,26,0.08)]" />

                {session?.user?.hostStatus === "verified" && (
                  <Link
                    href="/host"
                    className={`${profileItemClass} !text-[#1b5c57]`}
                    role="menuitem"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <LayoutList />
                    <span>{t("nav.hostConsole")}</span>
                  </Link>
                )}

                {session?.user && session.user.hostStatus !== "verified" && (
                  <Link
                    href="/host/onboarding"
                    className={`${profileItemClass} !text-[#1b5c57]`}
                    role="menuitem"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <PlusCircle />
                    <span>{t("nav.becomeHost")}</span>
                  </Link>
                )}

                {isOpsStaff(session?.user?.role) && (
                  <Link
                    href="/ops"
                    className={profileItemClass}
                    role="menuitem"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <Shield />
                    <span>{t("nav.operations")}</span>
                  </Link>
                )}

                <div className="my-2 h-px bg-[rgba(12,26,26,0.08)]" />

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    signOut();
                  }}
                  className="kama-menu-signout !mt-0 !py-2 !text-sm"
                  role="menuitem"
                >
                  <LogOut className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="font-medium">{t("nav.signOut")}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <MobileMenuOverlay
        isOpen={isOpen}
        close={close}
        session={session}
        unreadCount={unreadCount}
      />
    </div>
  );
};

export default Navbar;
