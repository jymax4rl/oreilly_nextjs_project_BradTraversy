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
import AnkhSvg from "./AnkhSvg";

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
      // The property you are animating
      clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
      duration: 1,
      ease: "power4.inOut",
    });
  };
  const openMenu = () => {
    gsap.to(".overlay-wrapper", {
      // The property you are animating
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      duration: 1,
      ease: "power4.inOut",
    });
    console.log("menu clicked");
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
           <AnkhSvg className="w-15 h-10 cursor-pointer transition-all duration-300 hover:scale-110 hover:rotate-6 stroke-transparent hover:stroke-[#4dd0e1] stroke-[0.5px]" />
          </Link>
        </div>

        <div className="hidden lg:flex space-x-12 items-center justify-center">
          {navLinks.map((link, index) => (
            <Link key={index} href={link.path}>
              <NavButton text={link.label}></NavButton>
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-end pointer mr-8">
          <button className="cursor-pointer" onClick={openMenu}>
            Menu
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
                  <Link
                    onClick={closeMenu}
                    className="menu-link-item-holder"
                    key={index}
                    href={link.path}
                  >
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
