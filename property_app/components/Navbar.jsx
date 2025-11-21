import React from "react";
import Image from "next/image";
import logIcon from "@/assets/images/person.png";
import logo from "@/assets/images/blackAnkhLogo.png";
import Hamburger from "@/components/hamburger";
import Link from "next/link";

const Navbar = () => {
  return (
    <nav className="grid grid-cols-3 grid-gap-4 h-[8vh]">
      <div className=" w-20 lg:w-40 flex items-center justify-center align-center">
        <Link href={"/"}>
          <Image
            className="lg:h-13 h-9 cursor-pointer w-auto rounded-full"
            alt="logo"
            src={logo}
          />
        </Link>
      </div>

      <div className=" flex items-center justify-center align-center"></div>

      <div className=" flex  lg:w-20 m-0  lg:ml-80 space-x-5 items-center justify-center align-center">
        <div className="flex   items-center justify-center space-x-8 align-center lg:absolute ">
          <Image
            className="cursor-pointer h-5 w-auto"
            alt="login Icon"
            src={logIcon}
          />
          <Hamburger />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
