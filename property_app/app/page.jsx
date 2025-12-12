import React from "react";
import Hero from "@/components/Hero";
import InfoBoxes from "@/components/InfoBoxes";
import Footer from "@/components/Footer";
import { MongoClient } from "mongodb";
import connectToDatabase from "@/config/database";
const HomePage = async () => {
  return (
    <div className="m-0 p-0  ">
      <div className="w-full ">
        <Hero className="h-[55vh] border-4 border-zinc-800" />
        <InfoBoxes />
      </div>
    </div>
  );
};

export default HomePage;
