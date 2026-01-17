import "@/assets/styles/globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import React from "react";

import StyledComponentsRegistry from "@/lib/registry";

import { CurrencyProvider } from "@/utils/CurrencyContext";
import AuthProvider from "@/components/AuthProvider";
import connectToDatabase from "@/config/database";
import Property from "@/models/Property";

export const metadata = {
  title: "ImKm Properties",
  description: "ImKm Properties made for Africans by Africans",
  keywords:
    "Rent in Senegal,Rent in Mali,Rent in Burkina,Rent in Ghana,Rent in Côte d'Ivoire,Rent in Niger,Rent in Chad,Rent in Cameroon,Rent in Guinea,rent in Rwanda,Rent in Uganda,Rent in Burundi,Rent in Tanzania,Rent in Kenya,Rent in Somalia,Rent in Ethiopia,Rent in Eritrea,Rent in Djibouti,Rent in Comoros,Rent in Madagascar,Rent in Mauritius,Rent in Seychelles,Rent in Malawi,Rent in Zambia,Rent in Zimbabwe,Rent in Mozambique,Rent in Angola,Rent in Congo",
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
