import React from "react";
import Image from "next/image";
import logIcon from "@/assets/images/person.png";
import logo from "@/assets/images/blackAnkhLogo.png";
import Hamburger from "@/components/hamburger";
import Link from "next/link";
import NavButton from "./NavButton";
import LoginNavBtn from "./LoginNavBtn";
import { FaGoogle } from "react-icons";

const Navbar = () => {
  return (
    // The nav is set to 3 col in md screens & 2 cols anything less
    <nav className="m-0 grid bg-white grid-cols-2 lg:grid-cols-[20%_60%_20%] h-[8vh]">
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
        <Link href={"/"}>
          <NavButton text={"Home"} />
        </Link>
        <Link href={"/properties"}>
          <NavButton text={"Properties"} />
        </Link>
        <Link href={"/properties/Properties"}>
          <NavButton text={"Add Property"} />
        </Link>
      </div>

      <div className=" flex p-0  mr-4 lg:mr-20   items-center justify-end lg:justify-center   ">
        <div className="flex start items-center justify-center space-x-4 lg:space-x-6 align-center lg:absolute ">
          <LoginNavBtn className=" " />
          <Image
            className=" cursor-pointer h-5 w-auto"
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
