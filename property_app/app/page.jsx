import React from "react";
import Hero from "@/components/Hero";
import InfoBoxes from "@/components/InfoBoxes";
import Footer from "@/components/Footer";

const HomePage = () => {
  console.log("hello");

  return (
    <div className="m-0 p-0  ">
      <div className="w-full h-[100vh] ">
        <Hero />
        <InfoBoxes />
      </div>
      <Footer />
    </div>
  );
};

export default HomePage;
