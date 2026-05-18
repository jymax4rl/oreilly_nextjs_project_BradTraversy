"use client";
import React, { Suspense, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Hamburger from "@/components/hamburger";
import "./navbar.css";
import gsap from "gsap";
import NavButton from "./NavButton";
import KamaLogo from "../assets/images/Kama logo - blue.svg";
import Pattern from "./Pattern";
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
} from "lucide-react";
import LoginNavButton from "./LoginNavBtn";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { getUnreadMessageCount } from "@/utils/actions/messageActions";
import MobileTopChrome from "@/components/MobileTopChrome";
import { useMenuOverlay } from "@/contexts/MenuOverlayContext";
import { isExploreMobileLayout } from "@/utils/exploreLayout";

const navLinks = [
  { path: "/", label: "Home", Icon: Home },
  { path: "/properties", label: "Properties", Icon: Building2 },
];

const overlayRowClass =
  "group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium leading-snug text-zinc-900 transition-colors hover:bg-zinc-50 active:bg-zinc-100";
const overlayIconClass =
  "h-5 w-5 shrink-0 text-zinc-400 transition-colors group-hover:text-zinc-600";

const Navbar = () => {
  const { data: session } = useSession();
  const { isOpen, toggle, close } = useMenuOverlay();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
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

  // GSAP Menu Animations
  const closeMenuAnimation = () => {
    gsap.to(".overlay-wrapper", {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
      duration: 1,
      ease: "power4.inOut",
    });
    gsap.to(".hotep-text", { opacity: 0, y: 20, duration: 0.5 });
  };

  const openMenuAnimation = () => {
    gsap.to(".overlay-wrapper", {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      duration: 1,
      ease: "power4.inOut",
    });
    gsap.fromTo(
      ".hotep-text",
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1.2, ease: "power3.out", delay: 0.3 },
    );
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

  // Centralized host-aware navigation logic
  const getHostNavItem = () => {
    if (!session?.user) return null;
    if (session.user.hostStatus === "verified") {
      return { path: "/properties/add", label: "List Property" };
    }
    return { path: "/host/onboarding", label: "Become a Host" };
  };

  const hostNavItem = getHostNavItem();

  return (
    <div>
      {explore && (
        <Suspense
          fallback={
            <div
              className="lg:hidden fixed left-0 right-0 top-0 z-50 h-[7.5rem] bg-white shadow-sm border-b border-zinc-100"
              aria-hidden
            />
          }
        >
          <MobileTopChrome />
        </Suspense>
      )}

      {!explore && (
        <nav className="menu-container m-0 grid bg-blue/10 backdrop-blur-sm grid-cols-2 z-50 fixed top-0 w-screen h-[8vh] lg:hidden">
          <div className="flex items-center ml-4 justify-start align-center">
            <Link href="/">
              <Image
                src={KamaLogo}
                alt="Kama Properties Logo"
                className="w-24 h-10 cursor-pointer transition-all duration-300 hover:scale-105"
              />
            </Link>
          </div>
          <div className="flex w-full items-center justify-end pointer mr-4">
            <Hamburger clickFunc={toggle} checked={isOpen} />
          </div>
        </nav>
      )}

      <nav className="menu-container m-0 hidden lg:grid bg-blue/10 backdrop-blur-sm grid-cols-[20%_60%_20%] z-50 fixed top-0 w-screen h-[8vh]">
        <div className="flex items-center ml-4 lg:ml-22 justify-start align-center">
          <Link href="/">
            <Image 
              src={KamaLogo} 
              alt="Kama Properties Logo" 
              className="lg:w-32 lg:h-12 w-24 h-10 cursor-pointer transition-all duration-300 hover:scale-105" 
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="flex space-x-12 p-2 items-center justify-center">
          {navLinks.map((link, index) => (
            <Link
              key={index}
              href={link.path}
              className={
                isActive(link.path) ? "p-2 text-white" : "p-2 text-black"
              }
            >
              <NavButton text={link.label} />
            </Link>
          ))}

          {hostNavItem && (
            <Link
              href={hostNavItem.path}
              className={
                isActive(hostNavItem.path) ? "p-2 text-white" : "p-2 text-black"
              }
            >
              <NavButton text={hostNavItem.label} />
            </Link>
          )}

          {session?.user?.role === "admin" && (
            <Link
              href="/admin/hosts"
              className={
                isActive("/admin/hosts") ? "p-2 text-white" : "p-2 text-black"
              }
            >
              <NavButton text="Admin" />
            </Link>
          )}
        </div>

        {/* Right Section */}
        <div className="flex w-full gap-12 items-center justify-end pointer mr-4">
          {/* Desktop Login */}
          {!session && (
            <div className="hidden lg:block">
              <LoginNavButton onClick={() => signIn("google")} />
            </div>
          )}

          {/* Profile Dropdown */}
          {session && (
            <div className="relative hidden lg:block">
              <button
                id="profile-trigger"
                onClick={toggleProfileMenu}
                className="flex items-center focus:outline-none"
                aria-expanded={isProfileOpen}
                aria-haspopup="true"
              >
                {profileImage ? (
                  <Image
                    src={profileImage}
                    alt="Profile"
                    width={40}
                    height={40}
                    className="rounded-full cursor-pointer object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <LuUserRound className="cursor-pointer w-8 h-8 text-zinc-600 hover:text-white transition-all duration-200" />
                )}
              </button>

              <div
                id="profile-menu"
                className={`absolute right-0 top-full mr-6 mt-3 w-[14em] origin-top-right rounded-xl border border-zinc-200 bg-white p-2 shadow-xl shadow-zinc-200/20 ring-1 ring-black ring-opacity-5 focus:outline-none transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] z-50 ${
                  isProfileOpen
                    ? "opacity-100 visible scale-100"
                    : "opacity-0 invisible scale-95"
                }`}
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="profile-trigger"
              >
                {/* User Info */}
                <div className="px-3 py-3 mb-2 border-b border-zinc-100">
                  <p className="text-sm font-medium text-zinc-900">
                    {session.user.name || "User"}
                  </p>
                  <p className="text-xs text-zinc-500 truncate font-normal mt-0.5">
                    {session.user.email}
                  </p>
                </div>

                {/* Menu Items */}
                <div className="space-y-1">
                  <Link
                    href="#"
                    className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
                    role="menuitem"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <LuUserRound className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600" />
                    <span className="font-medium">Profile</span>
                  </Link>

                  <Link
                    href="/saved-properties"
                    className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
                    role="menuitem"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <svg
                      className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    <span className="font-medium">Saved Properties</span>
                  </Link>

                  <Link
                    href="/messages"
                    className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
                    role="menuitem"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <svg className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <span className="font-medium">Messages</span>
                    {unreadCount > 0 && (
                      <span className="ml-auto flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="#"
                    className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
                    role="menuitem"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <svg
                      className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="font-medium">Settings</span>
                  </Link>
                </div>

                <div className="my-2 h-px bg-zinc-100"></div>

                {/* Host Actions */}
                {session?.user?.hostStatus === "verified" && (
                  <>
                    <Link
                      href="/properties/my-listings"
                      className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
                      role="menuitem"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <svg
                        className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M4 10h16M4 14h16M4 18h16"
                        />
                      </svg>
                      <span className="font-medium">My listings</span>
                    </Link>
                    <Link
                      href="/properties/add"
                      className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
                      role="menuitem"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <svg
                        className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      <span className="font-medium">List Property</span>
                    </Link>
                  </>
                )}

                {session?.user && session.user.hostStatus !== "verified" && (
                  <Link
                    href="/host/onboarding"
                    className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-800"
                    role="menuitem"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <svg
                      className="w-4 h-4 text-blue-400 group-hover:text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="font-medium">Become a Host</span>
                  </Link>
                )}

                {session?.user?.role === "admin" && (
                  <Link
                    href="/admin/hosts"
                    className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-purple-600 transition-colors hover:bg-purple-50 hover:text-purple-800"
                    role="menuitem"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <svg
                      className="w-4 h-4 text-purple-400 group-hover:text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span className="font-medium">Admin Dashboard</span>
                  </Link>
                )}

                <div className="my-2 h-px bg-zinc-100"></div>

                {/* Sign Out */}
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    signOut();
                  }}
                  className="group w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-red-50 hover:text-red-600"
                  role="menuitem"
                >
                  <svg
                    className="w-4 h-4 text-zinc-400 group-hover:text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span className="font-medium">Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Overlay Menu */}
      <div className="overlay-wrapper w-screen z-10">
        <Pattern>
          <div className="menu-overlay relative w-full h-screen overflow-y-auto px-5 py-10 font-sans antialiased text-zinc-900">
            <div className="mx-auto w-full max-w-md">
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
                      className={overlayRowClass}
                    >
                      <Icon className={overlayIconClass} aria-hidden />
                      {link.label}
                    </Link>
                  );
                })}

                {session?.user?.hostStatus === "verified" && (
                  <>
                    <Link
                      href="/properties/my-listings"
                      onClick={close}
                      className={overlayRowClass}
                    >
                      <LayoutList className={overlayIconClass} aria-hidden />
                      My listings
                    </Link>
                    <Link
                      href="/properties/add"
                      onClick={close}
                      className={overlayRowClass}
                    >
                      <PlusCircle className={overlayIconClass} aria-hidden />
                      List Property
                    </Link>
                  </>
                )}
                {session?.user && session.user.hostStatus !== "verified" && (
                  <Link
                    href="/host/onboarding"
                    onClick={close}
                    className={overlayRowClass}
                  >
                    <PlusCircle className={overlayIconClass} aria-hidden />
                    Become a Host
                  </Link>
                )}

                {session?.user?.role === "admin" && (
                  <Link
                    href="/admin/hosts"
                    onClick={close}
                    className={overlayRowClass}
                  >
                    <Shield className={overlayIconClass} aria-hidden />
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
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-[15px] font-medium text-zinc-900 shadow-sm transition-colors hover:bg-zinc-50"
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
                  <div
                    className="my-8 h-px bg-zinc-200/90"
                    role="presentation"
                  />
                  <p className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Account
                  </p>
                  <div className="mb-4 flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50/90 px-4 py-3">
                    {profileImage ? (
                      <Image
                        src={profileImage}
                        alt=""
                        width={48}
                        height={48}
                        className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-white"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#00C8FF] text-lg font-semibold text-white">
                        {session.user.name?.charAt(0) || "U"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-zinc-900">
                        {session.user.name || "User"}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        {session.user.email}
                      </p>
                    </div>
                  </div>

                  <nav
                    className="flex flex-col gap-0.5"
                    aria-label="Account shortcuts"
                  >
                    <Link href="#" onClick={close} className={overlayRowClass}>
                      <LuUserRound className={overlayIconClass} />
                      Profile
                    </Link>
                    <Link
                      href="/saved-properties"
                      onClick={close}
                      className={overlayRowClass}
                    >
                      <Heart className={overlayIconClass} aria-hidden />
                      Saved properties
                    </Link>
                    <Link
                      href="#"
                      onClick={close}
                      className={overlayRowClass}
                    >
                      <Settings className={overlayIconClass} aria-hidden />
                      Settings
                    </Link>
                  </nav>

                  <button
                    type="button"
                    onClick={() => {
                      close();
                      signOut();
                    }}
                    className="group mt-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-800"
                  >
                    <LogOut
                      className="h-5 w-5 shrink-0 text-red-500 group-hover:text-red-600"
                      aria-hidden
                    />
                    Sign out
                  </button>
                </>
              )}
            </div>
          </div>
        </Pattern>
      </div>
    </div>
  );
};

export default Navbar;
