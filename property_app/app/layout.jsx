import "@/assets/styles/globals.css";
import Navbar from "@/components/Navbar";
import AnkhSvg from "@/components/AnkhSvg";

import React from "react";

import StyledComponentsRegistry from "@/lib/registry";

export const metadata = {
  title: "Nextjs course",
  description: "Learning Nextjs with MongoDB",
  keywords: "Nextjs React & MongoDb",
};

function MainLayout({ children }) {
  return (
    <html lang="en">
      <body className="max-w-screen">
        <StyledComponentsRegistry>
          <Navbar className=" "></Navbar>
          <main className="pt-[8vh] h-[92vh] ">{children}</main>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}

export default MainLayout;
