import React from "react";
import Link from "next/link";
import HomeProperties from "@/components/HomeProperties";
import Currency from "@/components/Currency";
export const metadata = {
  title: "properties",
  description: "Learning Nextjs with MongoDB",
  keywords: "Nextjs React & MongoDb",
};

const PropertiesPage = () => {
  console.log("");
  return (
    <div>
      <HomeProperties />
    </div>
  );
};

export default PropertiesPage;
