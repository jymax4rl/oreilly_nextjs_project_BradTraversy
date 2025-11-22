"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Hamburger from "@/components/hamburger";
import logo from "@/assets/images/blackAnkhLogo.png";
import logIcon from "@/assets/images/person.png";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const navLinks = [
  { path: "/", label: "Home" },
  { path: "/properties", label: "Properties" },
  { path: "/properties/AddProperties", label: "Add Property" },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const overlayRef = useRef();
  const tl = useRef();

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  // --- GSAP animation ----
  useGSAP(() => {
    const overlay = overlayRef.current;

    gsap.set(overlay, {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
      display: "none",
    });
    gsap.set(".menu-link-item-holder", { y: 75, opacity: 0 });

    tl.current = gsap
      .timeline({ paused: true })
      .to(overlay, {
        duration: 1.2,
        display: "block",
        clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
        ease: "power4.inOut",
      })
      .to(
        ".menu-link-item-holder",
        {
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.1,
          ease: "power3.out",
        },
        "-=0.75"
      );
  }, []);

  // React to toggle
  useEffect(() => {
    if (isMenuOpen) tl.current.play();
    else tl.current.reverse();
  }, [isMenuOpen]);

  return (
    <div>
      {/* Navbar */}
      <nav className="grid lg:grid-cols-[20%_60%_20%] grid-cols-2 h-[8vh] bg-white">
        <div className="flex items-center ml-10">
          <Link href="/">
            <Image src={logo} alt="logo" className="h-12 w-auto" />
          </Link>
        </div>

        <div className="hidden lg:flex space-x-12 items-center justify-center">
          {navLinks.map((link) => (
            <Link key={link.path} href={link.path}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-end mr-8">
          <button onClick={toggleMenu}>
            <Hamburger />
          </button>
        </div>
      </nav>

      {/* --- CLIP-PATH OVERLAY --- */}
      <div
        ref={overlayRef}
        className="menu-overlay fixed top-0 left-0 w-screen h-screen bg-white z-50"
      >
        <div className="menu-links flex flex-col pt-20 pl-20 text-4xl space-y-8">
          {navLinks.map((link) => (
            <div className="menu-link-item" key={link.path}>
              <div className="menu-link-item-holder" onClick={toggleMenu}>
                <Link href={link.path}>{link.label}</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
