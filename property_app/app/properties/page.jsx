import React from "react";
import Link from "next/link";

export const metadata = {
  title: "properties",
  description: "Learning Nextjs with MongoDB",
  keywords: "Nextjs React & MongoDb",
};

const PropertiesPage = () => {
  console.log("");
  return (
    <div>
      <h1 className="">Properties Page</h1>
      <Link className="cursor-pointer" href={"/"}>
        Home
      </Link>
    </div>
  );
};

export default PropertiesPage;
