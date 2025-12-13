import React from "react";
import HomeProperties from "@/components/HomeProperties";
import connectToDatabase from "@/config/database";
import Property from "@/models/Property";

const PropertiesPage = async () => {
  // Fetch properties on the server
  await connectToDatabase();
  const properties = await Property.find({}).lean();

  // Convert MongoDB ObjectIds to strings for serialization
  const serializedProperties = properties.map((property) => ({
    ...property,
    _id: property._id.toString(),
  }));

  return (
    <div className="">
      {/* Pass server-fetched properties to client component */}
      <HomeProperties initialProperties={serializedProperties} />
    </div>
  );
};

export default PropertiesPage;
