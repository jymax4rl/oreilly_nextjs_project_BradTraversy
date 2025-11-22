"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Hamburger from "@/components/hamburger";
import logo from "@/assets/images/blackAnkhLogo.png";
import logIcon from "@/assets/images/person.png";
import "./navbar.css";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import NavButton from "./NavButton";

const navLinks = [
  { path: "/", label: "Home" },
  { path: "/properties", label: "Properties" },
  { path: "/properties/AddProperties", label: "Add Property" },
];

const Navbar = () => {
  const container = useRef();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleMenu = () => {
    setIsMobileOpen((prev) => !prev); // toggle state
  };
  const closeMenu = () => {
    gsap.to(".overlay-wrapper", {
      // Duration of the animation in seconds
      duration: 1,
      // The property to animate: 'y' or 'yPercent'
      y: "-100%", // This is the key value for sliding up
      // Other optional properties
      ease: "power2.inOut",
      delay: 0,
    });
  };
  const openMenu = () => {
    gsap.to(".overlay-wrapper", {
      // Duration of the animation in seconds
      duration: 1,
      // The property to animate: 'y' or 'yPercent'
      y: "0%", // This is the key value for sliding up
      // Other optional properties
      ease: "power2.inOut",
      delay: 0,
    });
  };
  return (
    <div>
      {/* // The nav is set to 3 col in md screens & 2 cols anything less */}
      <nav
        ref={container}
        className="menu-container m-0 grid bg-white grid-cols-2 lg:grid-cols-[20%_60%_20%] h-[8vh]"
      >
        <div className=" flex items-center ml-10 lg:ml-22 justify-start  align-center">
          <Link href={"/"}>
            <Image
              className="lg:h-13 h-12 cursor-pointer w-auto rounded-full"
              alt="logo"
              src={logo}
            />
          </Link>
        </div>

        <div className="hidden lg:flex space-x-12 items-center justify-center">
          {navLinks.map((link, index) => (
            <Link key={index} href={link.path}>
              <NavButton text={link.label}></NavButton>
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-end mr-8">
          <button onClick={openMenu}>
            <Hamburger />
          </button>
        </div>
      </nav>
      {/* //Menu-overlay on lg screens, show hide based on menu state */}
      <div className="hidden lg:block overlay-wrapper w-screen ">
        <div className="menu-overlay relative grid lg:grid-cols-2  w-full h-screen ">
          <div className="hidden lg:block leftWrapper relative w-full h-full  bg-red-500">
            <div className="   fixed left-10 bottom-15  ">
              <span onClick={closeMenu} className=" text-9xl cursor-pointer">
                &#x2715;
              </span>
            </div>
          </div>
          <div className="  rightWrapper  bg-green-500">
            <div className=" menu-links flex flex-col">
              {navLinks.map((link, index) => {
                return (
                  <Link key={index} href={link.path}>
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
