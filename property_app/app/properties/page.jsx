import React from "react";
import HomeProperties from "@/components/HomeProperties";
import PropertySearch from "@/components/PropertySearch";

const PropertiesPage = () => {
  return (
    <div className="">
      {/* 3. Pass the current currency value to the Property component */}
      <HomeProperties />
    </div>
  );
};

export default PropertiesPage;
