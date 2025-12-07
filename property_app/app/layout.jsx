import "@/assets/styles/globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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
          <Navbar className=" bg-transparent"></Navbar>
          <main className="">{children}</main>
          <Footer className="" />
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}

export default MainLayout;
