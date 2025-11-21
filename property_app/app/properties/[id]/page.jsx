"use client";

import React from "react";
import Link from "next/link";

const PropertyPage = () => {
  return (
    <div>
      <h1>Property page in [id] folder</h1>

      <Link className="cursor-pointer" href={"/"}>
        Home
      </Link>

      <div></div>
    </div>
  );
};

export default PropertyPage;
