import React from "react";
import Image from "next/image";

export const PropertyHeaderImage = ({ image }) => {
  return (
    <div>
      <Image src={image} alt="Property Image" width={1000} height={600} />
    </div>
  );
};

export default PropertyHeaderImage;
