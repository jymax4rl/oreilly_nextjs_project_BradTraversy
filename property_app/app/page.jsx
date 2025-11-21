import React from "react";
import Link from "next/link";

const HomePage = () => {
  console.log("hello");

  return (
    <div>
      <h1 className="">HomePage</h1>
      <Link href={"/properties"}>See Properties</Link>
    </div>
  );
};

export default HomePage;
