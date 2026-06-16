import React from "react";
import Hero from "@/components/Hero";
import InfoBoxes from "@/components/InfoBoxes";
import PropertiesPage from "./properties/page";

export const dynamic = "force-dynamic";

const HomePage = () => {
  return (
    <div className="m-0 p-0  ">
      <div className="w-full ">
        <Hero className="h-[55vh] border-4 border-zinc-800" />

        <PropertiesPage maxProperties={11} />

        <InfoBoxes />
      </div>
    </div>
  );
};

export default HomePage;
