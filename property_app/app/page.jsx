import React from "react";
import Hero from "@/components/Hero";
import InfoBoxes from "@/components/InfoBoxes";
import HomeProperties from "@/components/HomeProperties";
import PropertiesPage from "./properties/page";
const HomePage = () => {
  return (
    <div className="m-0 p-0  ">
      <div className="w-full ">
        <Hero className="h-[55vh] border-4 border-zinc-800" />
        <PropertiesPage maxProperties={10} />
        <InfoBoxes />
      </div>
    </div>
  );
};

export default HomePage;
