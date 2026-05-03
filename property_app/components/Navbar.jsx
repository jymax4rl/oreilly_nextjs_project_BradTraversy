"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Hamburger from "@/components/hamburger";
import ImhotepImage from "../assets/images/Imhotep.png";
import "./navbar.css";
import gsap from "gsap";
import NavButton from "./NavButton";
import AnkhSvg from "./AnkhSvg";
import Pattern from "./Pattern";
import { LuUserRound } from "react-icons/lu";
import LoginNavButton from "./LoginNavBtn";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";

const navLinks = [
  { path: "/", label: "Home" },
  { path: "/properties", label: "Properties" },
];

const Navbar = () => {
  const { data: session } = useSession();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const pathname = usePathname();
  const profileImage = session?.user?.image;

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

  const toggleMenu = () => {
    setIsMobileOpen((prev) => !prev);
  };

  const toggleProfileMenu = () => {
    setIsProfileOpen((prev) => !prev);
  };

  useEffect(() => {
    if (isMobileOpen) {
      openMenuAnimation();
    } else {
      closeMenuAnimation();
    }
  }, [isMobileOpen]);

  // Close menus on route change
  useEffect(() => {
    setIsMobileOpen(false);
    setIsProfileOpen(false);
  }, [pathname]);

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
      <nav className="menu-container m-0 grid bg-blue/10 backdrop-blur-sm grid-cols-2 lg:grid-cols-[20%_60%_20%] z-50 fixed w-screen h-[8vh]">
        {/* Logo */}
        <div className="flex items-center ml-10 lg:ml-22 justify-start align-center">
          <Link href="/">
            <AnkhSvg className="lg:w-15 lg:h-10 w-10 h-8 cursor-pointer transition-all duration-300 hover:scale-110 hover:rotate-6 stroke-transparent hover:stroke-[#4dd0e1] stroke-[0.5px]" />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex space-x-12 p-2 items-center justify-center">
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
        <div className="flex w-full gap-12 items-center justify-end pointer mr-8">
          {/* Desktop Login */}
          {!session && (
            <div className="hidden lg:block">
              <LoginNavButton onClick={() => signIn("google")} />
            </div>
          )}

          {/* Profile Dropdown */}
          {session && (
            <div className="relative">
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

          <Hamburger clickFunc={toggleMenu} />
        </div>
      </nav>

      {/* Mobile Overlay Menu */}
      <div className="mt-[8vh] overlay-wrapper w-screen z-10">
        <Pattern>
          <div className="menu-overlay relative grid grid-cols-1 lg:grid-cols-2 text-black w-full h-screen">
            <div className="lg:block leftWrapper relative w-full h-full">
              <div className="relative image w-[90%] h-[80%] flex items-center justify-center border-black p-auto m-auto">
                <Image
                  src={ImhotepImage}
                  className="rounded-full cursor-pointer h-[80%] w-[80%] object-cover"
                  alt="Imhotep"
                />
                <div className="hotep-text absolute text-3xl text-white">
                  Hotep
                </div>
              </div>
              <div className="fixed left-10 bottom-15">
                <span onClick={toggleMenu} className="text-9xl cursor-pointer">
                  &#x2715;
                </span>
              </div>
            </div>

            <div className="rightWrapper">
              <div className="menu-links flex flex-col">
                {navLinks.map((link, index) => (
                  <Link
                    onClick={toggleMenu}
                    className="menu-link-item-holder mt-4"
                    key={index}
                    href={link.path}
                  >
                    {link.label}
                  </Link>
                ))}

                {hostNavItem && (
                  <Link
                    onClick={toggleMenu}
                    href={hostNavItem.path}
                    className="menu-link-item-holder mt-4"
                  >
                    {hostNavItem.label}
                  </Link>
                )}

                {session?.user?.role === "admin" && (
                  <Link
                    onClick={toggleMenu}
                    href="/admin/hosts"
                    className="menu-link-item-holder mt-4"
                  >
                    Admin Dashboard
                  </Link>
                )}

                {!session && (
                  <div className="menu-link-item-holder mt-4">
                    <LoginNavButton onClick={() => signIn("google")} />
                  </div>
                )}

                {session && (
                  <button
                    onClick={() => {
                      toggleMenu();
                      signOut();
                    }}
                    className="menu-link-item-holder mt-4 text-left"
                  >
                    Sign Out
                  </button>
                )}
              </div>
            </div>
          </div>
        </Pattern>
      </div>
    </div>
  );
};

export default Navbar;
