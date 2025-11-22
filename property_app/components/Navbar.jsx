"use client";
import React from "react";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import logIcon from "@/assets/images/person.png";
import logo from "@/assets/images/blackAnkhLogo.png";
import Hamburger from "@/components/hamburger";
import Link from "next/link";
import NavButton from "./NavButton";
import LoginNavBtn from "./LoginNavBtn";
import { FaGoogle } from "react-icons";
import "./navbar.css";

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

        <div className="hidden lg:flex space-x-16 items-center justify-center align-center">
          {navLinks.map((link, index) => {
            return (
              <Link key={link.index} href={link.path}>
                <NavButton text={link.label} />
              </Link>
            );
          })}
        </div>

        <div className=" flex p-0  mr-4 lg:mr-20   items-center justify-end lg:justify-center   ">
          <div className="flex start items-center justify-center space-x-4 lg:space-x-6 align-center lg:absolute ">
            <LoginNavBtn className=" " />
            <Image
              className=" cursor-pointer h-5 w-auto"
              alt="login Icon"
              src={logIcon}
            />
            <button onClick={toggleMenu}>
              <Hamburger />
            </button>
          </div>
        </div>
      </nav>
      {/* //Menu-overlay on lg screens, show hide based on menu state */}
      <div className=" lg:block overlay-wrapper absolute top-0 w-screen ">
        <div className="menu-overlay relative grid lg:grid-cols-2  w-full h-screen ">
          <div className="hidden lg:block leftWrapper relative w-full h-full  bg-red-500">
            <div className="   fixed left-10 bottom-15  ">
              <span className=" text-9xl cursor-pointer">&#x2715;</span>
            </div>
          </div>
          <div className="  rightWrapper  bg-green-500">
            <div className=" menu-links flex flex-col">
              {navLinks.map((link, index) => {
                return (
                  <Link key={link.index} href={link.path}>
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
