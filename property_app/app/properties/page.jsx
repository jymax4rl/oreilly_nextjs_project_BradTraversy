import React from "react";
import HomeProperties from "@/components/HomeProperties";
import fetchProperties from "@/utils/request";

const PropertiesPage = async ({ maxProperties }) => {
  const properties = await fetchProperties();
  //sort propeties by name
  properties.sort((a, b) => a.name.localeCompare(b.name));

  //sort properties by date
  // properties.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Convert MongoDB ObjectIds to strings for serialization
  const serializedProperties = properties.map((property) => ({
    // spread all properties
    ...property,
    // Convert ObjectId to string
    _id: property._id.toString(),
  }));

  //limit of 10 properties
  const limitedProperties = serializedProperties.slice(0, maxProperties);

  return (
    <div className="">
      {/* Pass server-fetched properties to client component */}
      <HomeProperties initialProperties={limitedProperties} />
    </div>
  );
};

export default PropertiesPage;
