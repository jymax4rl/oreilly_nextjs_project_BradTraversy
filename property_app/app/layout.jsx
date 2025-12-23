import "@/assets/styles/globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import React from "react";

import StyledComponentsRegistry from "@/lib/registry";

import { CurrencyProvider } from "@/utils/CurrencyContext";
import AuthProvider from "@/components/AuthProvider";

export const metadata = {
  title: "Nextjs course",
  description: "Learning Nextjs with MongoDB",
  keywords: "Nextjs React & MongoDb",
};

function MainLayout({ children }) {
  console.log(children);
  return (
    <AuthProvider>
      <html lang="en">
        <body className="max-w-screen">
          <StyledComponentsRegistry>
            <CurrencyProvider>
              <Navbar className=" bg-transparent"></Navbar>
              <main className="">{children}</main>
              <Footer className="" />
            </CurrencyProvider>
          </StyledComponentsRegistry>
        </body>
      </html>
    </AuthProvider>
  );
}

export default MainLayout;
