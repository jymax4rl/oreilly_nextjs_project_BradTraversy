import React from "react";
import Link from "next/link";
import Button from "./Button";
const InfoBoxes = () => {
  return (
    <section className=" w-[100vw] mx-auto flex align-center justify-center h-[55vh]   py-10 px-4 max-w-7xl ">
      {/* Grid Container: 1 column by default (mobile), 2 columns on lg screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: For Renters */}
        <div className="bg-white m-auto h-[30vh] p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">For Renters</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Find your dream rental property. Browse our extensive list of
            apartments, homes, and condos tailored to your lifestyle.
          </p>
          <Button
            text="Browse Properties"
            link="/properties"
            borderColor="black"
          />
        </div>

        {/* Card 2: For Landlords */}
        <div className="bg-blue-50 m-auto h-[30vh] p-8 rounded-xl shadow-sm border border-blue-100 hover:shadow-lg transition-shadow duration-300">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">
            For Landlords
          </h2>
          <p className="text-blue-700 mb-8 leading-relaxed">
            Ready to earn passive income? List your property with us today and
            reach thousands of potential tenants instantly.
          </p>
          <Button text="Add Property" link="/properties/add" />
        </div>
      </div>
    </section>
  );
};

export default InfoBoxes;
