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
    gsap.to(".hotep-text", {
      opacity: 0,
      y: 20,
      duration: 0.5,
    });
  };
  const openMenu = () => {
    gsap.to(".overlay-wrapper", {
      // The property you are animating
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      duration: 1,
      ease: "power4.inOut",
    });
    gsap.fromTo(
      ".hotep-text",
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1.2, ease: "power3.out", delay: 0.3 }
    );
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
            <AnkhSvg className="lg:w-15 lg:h-10 w-10 h-8 cursor-pointer transition-all duration-300 hover:scale-110 hover:rotate-6 stroke-transparent hover:stroke-[#4dd0e1] stroke-[0.5px]" />
          </Link>
        </div>

        <div className="hidden lg:flex space-x-12 items-center justify-center">
          {navLinks.map((link, index) => (
            <Link key={index} href={link.path}>
              <NavButton text={link.label}></NavButton>
            </Link>
          ))}
        </div>

        <div className="flex  gap-8 border-black items-center justify-end pointer mr-8">
          <div>
            <LoginNavButton></LoginNavButton>
          </div>

          <NavButton
            className="cursor-pointer hidden lg:block"
            clickFunc={openMenu}
            text="Menu"
          ></NavButton>

          <Hamburger className="lg:hidden" clickFunc={openMenu}></Hamburger>

          <div>
            <LuUserRound className="cursor-pointer" alt="login-icon" />
          </div>
        </div>
      </nav>
      {/* //Menu-overlay on lg screens, show hide based on menu state */}

      <div className=" overlay-wrapper w-screen  z-10  ">
        <Pattern>
          <div className="menu-overlay relative grid grid-cols-1 lg:grid-cols-2 text-black w-full h-screen ">
            <div className=" leftWrapper relative w-full h-full">
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
                <span onClick={closeMenu} className=" text-9xl  cursor-pointer">
                  &#x2715;
                </span>
              </div>
            </div>

            <div className="rightWrapper">
              <div
                onClick={closeMenu}
                className="menuClose cursor-pointer justify-self-end mr-8 mt-8"
              >
                Close
              </div>
              <div className=" menu-links flex flex-col">
                {navLinks.map((link, index) => {
                  return (
                    <Link
                      onClick={closeMenu}
                      className="menu-link-item-holder mt-4"
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
        </Pattern>
      </div>
    </div>
  );
};

export default Navbar;
