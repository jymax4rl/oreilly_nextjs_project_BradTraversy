import "@/assets/styles/globals.css";
import Navbar from "@/components/Navbar";

import React from "react";

export const metadata = {
  title: "Nextjs course",
  description: "Learning Nextjs with MongoDB",
  keywords: "Nextjs React & MongoDb",
};

function MainLayout({ children }) {
  return (
    <html lang="en">
      <body className="max-w-screen">
        <Navbar className=" "></Navbar>
        <main className="pt-[8vh] h-[92vh] ">{children}</main>
      </body>
    </html>
  );
}

export default MainLayout;
