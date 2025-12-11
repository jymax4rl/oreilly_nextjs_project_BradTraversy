import React from "react";
import HomeProperties from "@/components/HomeProperties";

const PropertiesPage = () => {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">Property Listings</h1>

      {/* 3. Pass the current currency value to the Property component */}
      <HomeProperties />
    </div>
  );
};

export default PropertiesPage;
