"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Hamburger from "@/components/hamburger";
import logo from "@/assets/images/blackAnkhLogo.png";
import logIcon from "@/assets/images/person.png";
import ImhotepImage from "../assets/images/Imhotep.png";
import "./navbar.css";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import NavButton from "./NavButton";
import AnkhSvg from "./AnkhSvg";
import Pattern from "./Pattern";
import { LuUserRound } from "react-icons/lu";
import LoginNavButton from "./LoginNavBtn";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession, getProviders } from "next-auth/react";

const navLinks = [
  { path: "/", label: "Home" },
  { path: "/properties", label: "Properties" },
];

const Navbar = () => {
  const { data: session } = useSession();
  const [providers, setProviders] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const container = useRef();
  const pathname = usePathname();
  const profileImage = session?.user?.image;

  console.log("profileImage:", profileImage);

  console.log("session:", session);
  // 1. Define your GSAP animations
  const closeMenuAnimation = () => {
    gsap.to(".overlay-wrapper", {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
      duration: 1,
      ease: "power4.inOut",
    });
    gsap.to(".hotep-text", {
      opacity: 0,
      y: 20,
      duration: 0.5,
    });
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
      { opacity: 1, y: 0, duration: 1.2, ease: "power3.out", delay: 0.3 }
    );
  };

  // 2. The Toggle function ONLY updates state
  const toggleMenu = () => {
    setIsMobileOpen((prev) => !prev);
  };

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const toggleProfileMenu = () => {
    setIsProfileOpen((prev) => !prev);
  };

  useEffect(() => {
    const setAuthProviders = async () => {
      const res = await getProviders();
      setProviders(res);
    };
    setAuthProviders();
  }, []);
  console.log(providers);

  // 3. The useEffect listens to state changes and triggers GSAP
  useEffect(() => {
    if (isMobileOpen) {
      openMenuAnimation();
    } else {
      closeMenuAnimation();
    }
  }, [isMobileOpen]); // <--- This dependency array is key!

  return (
    <div className="">
      {/* // The nav is set to 3 col in md screens & 2 cols anything less */}
      <nav
        ref={container}
        className="menu-container m-0 grid bg-blue/10 backdrop-blur-sm grid-cols-2 lg:grid-cols-[20%_60%_20%] z-50 fixed w-screen h-[8vh]"
      >
        <div className=" flex items-center ml-10 lg:ml-22 justify-start  align-center">
          <Link href={"/"}>
            <AnkhSvg className="lg:w-15 lg:h-10 w-10 h-8 cursor-pointer transition-all duration-300 hover:scale-110 hover:rotate-6 stroke-transparent hover:stroke-[#4dd0e1] stroke-[0.5px]" />
          </Link>
        </div>

        <div className="hidden  lg:flex space-x-12 p-2 items-center justify-center">
          {navLinks.map((link, index) => (
            <Link
              key={index}
              href={link.path}
              className={
                pathname === link.path ? " p-2 text-white" : "p-2 text-black"
              }
            >
              <NavButton text={link.label}></NavButton>
            </Link>
          ))}
          {session && (
            <Link
              href="/properties/add"
              className={
                pathname === "/properties/add"
                  ? " p-2 text-white"
                  : " text-black"
              }
            >
              <NavButton text="Add Property"></NavButton>
            </Link>
          )}
        </div>

        <div className="flex w-full gap-12  items-center justify-end pointer mr-8">
          <div className="flex border-black">
            {!session && (
              <div className="hidden lg:flex">
                {providers &&
                  Object.values(providers).map((provider, index) => (
                    <LoginNavButton
                      key={index}
                      onClick={() => signIn(provider.id)}
                    />
                  ))}
              </div>
            )}
          </div>
          <div className="">
            <NavButton
              className="cursor-pointer text-white hidden p-0 m-0 lg:block "
              clickFunc={toggleMenu}
              text={isMobileOpen ? "Close" : "Menu"} // Optional: change text based on state
            >
              {session && (
                <div className="relative">
                  {!profileImage && (
                    <div className="">
                      <LuUserRound
                        id="profile-trigger"
                        onClick={toggleProfileMenu}
                        className="cursor-pointer w-6 h-6 text-zinc-600 hover:text-white transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
                      />
                    </div>
                  )}
                  <div>
                    <Image
                      src={session.user.image}
                      alt="profile"
                      width={40}
                      onClick={toggleProfileMenu}
                      height={40}
                      className="rounded-full cursor-pointer"
                    />
                  </div>
                  {/* <!-- Profile Menu --> */}
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
                    {/* <!-- User Info Section --> */}
                    <div className="px-3 py-3 mb-2 border-b border-zinc-100">
                      <p className="text-sm font-medium text-zinc-900">
                        {session.user.name}
                      </p>
                      <p className="text-xs text-zinc-500 truncate font-normal mt-0.5">
                        {session.user.email}
                      </p>
                    </div>

                    {/* <!-- Menu Items --> */}
                    <div className="space-y-1">
                      <Link
                        href="#"
                        className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
                        role="menuitem"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <LuUserRound
                          data-lucide="user"
                          className="w-4 h-4 text-black hover:text-white"
                        ></LuUserRound>
                        <span className="font-medium">{session.user.name}</span>
                      </Link>
                      <Link
                        href="#"
                        className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
                        role="menuitem"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <div className="flex items-center gap-3">
                          <i
                            data-lucide="heart"
                            className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600"
                          ></i>
                          <span className="font-medium">Saved Properties</span>
                        </div>
                        <span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-xs font-medium text-zinc-600 group-hover:bg-white">
                          3
                        </span>
                      </Link>

                      <Link
                        href="#"
                        className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
                        role="menuitem"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <i
                          data-lucide="settings-2"
                          className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600"
                        ></i>
                        <span className="font-medium">Settings</span>
                      </Link>
                    </div>

                    {/* <!-- Divider --> */}
                    <div className="my-2 h-px bg-zinc-100"></div>

                    {/* <!-- Actions --> */}
                    <div className="space-y-1">
                      <a
                        href="#"
                        className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-red-50 hover:text-red-600"
                        role="menuitem"
                      >
                        <button
                          className="cursor-pointer w-full text-zinc-400 group-hover:text-red-500"
                          onClick={() => signOut()}
                        >
                          Sign out
                        </button>
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </NavButton>
          </div>

          <Hamburger className="" clickFunc={toggleMenu}></Hamburger>
        </div>
      </nav>
      {/* //Menu-overlay on lg screens, show hide based on menu state */}

      <div className="mt-[8vh] overlay-wrapper w-screen  z-10  ">
        <Pattern>
          <div className="menu-overlay  relative grid grid-cols-1 lg:grid-cols-2 text-black w-full h-screen ">
            <div className="lg:block leftWrapper relative w-full h-full">
              <div className="relative image w-[90%] h-[80%]  flex items-center justify-center border-black p-auto m-auto">
                <Image
                  src={ImhotepImage}
                  className="rounded-full cursor-pointer h-[80%] w-[80%] object-cover"
                  alt=""
                />
                <div className="hotep-text absolute text-3xl text-white">
                  Hotep
                </div>
              </div>
              <div className="   fixed left-10 bottom-15  ">
                <span
                  onClick={toggleMenu}
                  className=" text-9xl  cursor-pointer"
                >
                  &#x2715;
                </span>
              </div>
            </div>

            <div className="rightWrapper">
              <div className=" menu-links flex flex-col">
                {navLinks.map((link, index) => {
                  return (
                    <Link
                      onClick={toggleMenu}
                      className="menu-link-item-holder mt-4"
                      key={index}
                      href={link.path}
                    >
                      {link.label}
                    </Link>
                  );
                })}
                {session && (
                  <Link
                    onClick={toggleMenu}
                    href={"/properties/add"}
                    className="menu-link-item-holder mt-4"
                  >
                    Add Property
                  </Link>
                )}
                {!session && (
                  <div className="menu-link-item-holder mt-4">
                    {providers &&
                      Object.values(providers).map((provider, index) => (
                        <LoginNavButton
                          key={index}
                          onClick={() => signIn(provider.id)}
                        />
                      ))}
                  </div>
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
