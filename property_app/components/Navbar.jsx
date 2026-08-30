"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Hamburger from "@/components/hamburger";
import "./navbar.css";
import gsap from "gsap";
import NavButton from "./NavButton";
import BrandLogo from "@/components/BrandLogo";
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
import { signIn, signOut, useSession } from "next-auth/react";
import { getUnreadMessageCount } from "@/utils/actions/messageActions";
import { useMenuOverlay } from "@/contexts/MenuOverlayContext";
import { isExploreMobileLayout } from "@/utils/exploreLayout";
import { isFullscreenRoute } from "@/utils/fullscreenRoutes";

const navLinks = [
  { path: "/", label: "Home", Icon: Home },
  { path: "/properties", label: "Properties", Icon: Building2 },
];

const profileItemClass = "kama-profile-item font-medium";

const Navbar = () => {
  const { data: session } = useSession();
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
    if (!session?.user) return null;
    if (session.user.hostStatus === "verified") {
      return { path: "/properties/add", label: "List Property" };
    }
    return { path: "/host/onboarding", label: "Become a Host" };
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
              <NavButton text={link.label} />
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

          {session?.user?.role === "admin" && (
            <Link
              href="/admin/hosts"
              className={
                isHome || !isActive("/admin/hosts")
                  ? "p-2 text-black"
                  : "p-2 text-white"
              }
            >
              <NavButton text="Admin" />
            </Link>
          )}
        </div>

        {/* Right Section */}
        <div className="flex w-full gap-3 lg:gap-6 items-center justify-end pointer mr-4">
          {!session && (
            <div className="hidden lg:block">
              <LoginNavButton onClick={() => signIn("google")} />
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
                  <LuUserRound className="cursor-pointer w-8 h-8 text-[#0c1a1a]/70 hover:text-[#1b5c57] transition-all duration-200" />
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
                    <span>Profile</span>
                  </Link>

                  <Link
                    href="/saved-properties"
                    className={profileItemClass}
                    role="menuitem"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <Heart />
                    <span>Saved Properties</span>
                  </Link>

                  <Link
                    href="/my-bookings"
                    className={profileItemClass}
                    role="menuitem"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <CalendarCheck />
                    <span>My Bookings</span>
                  </Link>

                  <Link
                    href="/messages"
                    className={profileItemClass}
                    role="menuitem"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <MessageSquare />
                    <span>Messages</span>
                    {unreadCount > 0 && (
                      <span className="ml-auto flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#1b5c57] px-1 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="#"
                    className={profileItemClass}
                    role="menuitem"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <Settings />
                    <span>Settings</span>
                  </Link>
                </div>

                <div className="my-2 h-px bg-[rgba(12,26,26,0.08)]" />

                {session?.user?.hostStatus === "verified" && (
                  <>
                    <Link
                      href="/properties/my-listings"
                      className={profileItemClass}
                      role="menuitem"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <LayoutList />
                      <span>My listings</span>
                    </Link>
                    <Link
                      href="/host/reservations"
                      className={profileItemClass}
                      role="menuitem"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <CalendarCheck />
                      <span>Manage reservations</span>
                    </Link>
                    <Link
                      href="/properties/add"
                      className={profileItemClass}
                      role="menuitem"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <PlusCircle />
                      <span>List Property</span>
                    </Link>
                  </>
                )}

                {session?.user && session.user.hostStatus !== "verified" && (
                  <Link
                    href="/host/onboarding"
                    className={`${profileItemClass} !text-[#1b5c57]`}
                    role="menuitem"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <PlusCircle />
                    <span>Become a Host</span>
                  </Link>
                )}

                {session?.user?.role === "admin" && (
                  <Link
                    href="/admin/hosts"
                    className={profileItemClass}
                    role="menuitem"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <Shield />
                    <span>Admin Dashboard</span>
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
                  <span className="font-medium">Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Overlay Menu */}
      <div
        className={`overlay-wrapper w-screen ${isOpen ? "is-open" : ""}`}
        aria-hidden={!isOpen}
      >
        <div className="kama-menu-shell">
          <div className="kama-menu-panel">
            <div className="relative z-[1] flex items-center justify-between border-b border-[rgba(12,26,26,0.06)] px-5 py-4 [padding-top:max(1rem,env(safe-area-inset-top))]">
              <BrandLogo className="h-9 w-auto" href="/" />
              <button
                type="button"
                onClick={close}
                className="rounded-full px-3 py-2 text-sm font-medium text-[#4a5c5b] transition-colors hover:bg-[rgba(27,92,87,0.1)] hover:text-[#1b5c57]"
              >
                Close
              </button>
            </div>

            <div className="kama-menu-scroll">
              <div className="mx-auto w-full max-w-md">
                <p className="kama-menu-section" style={{ marginTop: 0 }}>
                  Explore
                </p>
                <nav
                  className="menu-links flex flex-col gap-0.5"
                  aria-label="Main navigation"
                >
                  {navLinks.map((link, index) => {
                    const Icon = link.Icon;
                    return (
                      <Link
                        key={index}
                        href={link.path}
                        onClick={close}
                        className="kama-menu-row"
                      >
                        <Icon className="kama-menu-row-icon" aria-hidden />
                        {link.label}
                      </Link>
                    );
                  })}

                  {session?.user?.hostStatus === "verified" && (
                    <>
                      <Link
                        href="/properties/my-listings"
                        onClick={close}
                        className="kama-menu-row"
                      >
                        <LayoutList
                          className="kama-menu-row-icon"
                          aria-hidden
                        />
                        My listings
                      </Link>
                      <Link
                        href="/host/reservations"
                        onClick={close}
                        className="kama-menu-row"
                      >
                        <CalendarCheck
                          className="kama-menu-row-icon"
                          aria-hidden
                        />
                        Manage reservations
                      </Link>
                      <Link
                        href="/properties/add"
                        onClick={close}
                        className="kama-menu-row"
                      >
                        <PlusCircle
                          className="kama-menu-row-icon"
                          aria-hidden
                        />
                        List Property
                      </Link>
                    </>
                  )}
                  {session?.user &&
                    session.user.hostStatus !== "verified" && (
                      <Link
                        href="/host/onboarding"
                        onClick={close}
                        className="kama-menu-row"
                      >
                        <PlusCircle
                          className="kama-menu-row-icon"
                          aria-hidden
                        />
                        Become a Host
                      </Link>
                    )}

                  {session?.user?.role === "admin" && (
                    <Link
                      href="/admin/hosts"
                      onClick={close}
                      className="kama-menu-row"
                    >
                      <Shield className="kama-menu-row-icon" aria-hidden />
                      Admin Dashboard
                    </Link>
                  )}
                </nav>

                {!session && (
                  <div className="mt-8">
                    <button
                      type="button"
                      onClick={() => {
                        signIn("google");
                        close();
                      }}
                      className="kama-menu-cta"
                    >
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
                      Sign in with Google
                    </button>
                  </div>
                )}

                {session && (
                  <>
                    <div className="kama-menu-divider" role="presentation" />
                    <p className="kama-menu-section" style={{ marginTop: 0 }}>
                      Account
                    </p>
                    <div className="kama-menu-account mb-3">
                      {profileImage ? (
                        <Image
                          src={profileImage}
                          alt=""
                          width={48}
                          height={48}
                          className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-white"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1b5c57] text-lg font-semibold text-white">
                          {session.user.name?.charAt(0) || "U"}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#0c1a1a]">
                          {session.user.name || "User"}
                        </p>
                        <p className="truncate text-xs text-[#4a5c5b]">
                          {session.user.email}
                        </p>
                      </div>
                    </div>

                    <nav
                      className="flex flex-col gap-0.5"
                      aria-label="Account shortcuts"
                    >
                      <Link
                        href="/profile"
                        onClick={close}
                        className="kama-menu-row"
                      >
                        <LuUserRound className="kama-menu-row-icon" />
                        Profile
                      </Link>
                      <Link
                        href="/saved-properties"
                        onClick={close}
                        className="kama-menu-row"
                      >
                        <Heart className="kama-menu-row-icon" aria-hidden />
                        Saved properties
                      </Link>
                      <Link
                        href="/my-bookings"
                        onClick={close}
                        className="kama-menu-row"
                      >
                        <CalendarCheck
                          className="kama-menu-row-icon"
                          aria-hidden
                        />
                        My Bookings
                      </Link>
                      <Link
                        href="/messages"
                        onClick={close}
                        className="kama-menu-row"
                      >
                        <MessageSquare
                          className="kama-menu-row-icon"
                          aria-hidden
                        />
                        Messages
                        {unreadCount > 0 && (
                          <span className="ml-auto flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#1b5c57] px-1 text-[10px] font-bold text-white">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </Link>
                      {session?.user?.hostStatus === "verified" && (
                        <>
                          <Link
                            href="/host/listings"
                            onClick={close}
                            className="kama-menu-row"
                          >
                            <Building2
                              className="kama-menu-row-icon"
                              aria-hidden
                            />
                            My Listings
                          </Link>
                          <Link
                            href="/properties/add"
                            onClick={close}
                            className="kama-menu-row"
                          >
                            <PlusCircle
                              className="kama-menu-row-icon"
                              aria-hidden
                            />
                            Add New Listing
                          </Link>
                        </>
                      )}
                      <Link
                        href="#"
                        onClick={close}
                        className="kama-menu-row"
                      >
                        <Settings className="kama-menu-row-icon" aria-hidden />
                        Settings
                      </Link>
                    </nav>

                    <button
                      type="button"
                      onClick={() => {
                        close();
                        signOut();
                      }}
                      className="kama-menu-signout"
                    >
                      <LogOut className="h-5 w-5 shrink-0" aria-hidden />
                      Sign out
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
