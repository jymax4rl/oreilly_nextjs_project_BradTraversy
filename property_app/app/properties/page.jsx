import React from "react";
import HomeProperties from "@/components/HomeProperties";
import Property from "@/models/Property";
import connectToDatabase from "@/config/database";

const PropertiesPage = async ({ maxProperties }) => {
  // Connect to database first!
  await connectToDatabase();

  // DEBUG: Check all properties in database
  const allProps = await Property.find({}).lean();
  const featuredCount = allProps.filter((p) => p.is_featured === true).length;
  const notFeaturedCount = allProps.filter(
    (p) => p.is_featured === false
  ).length;
  console.log("📊 Total properties in DB:", allProps.length);
  console.log(
    "✅ Featured:",
    featuredCount,
    "| ❌ Not featured:",
    notFeaturedCount
  );

  const properties = maxProperties
    ? //if maxProperties is defined, get maxProperties featured properties
      await Property.find({ is_featured: true }).limit(maxProperties).lean()
    : //else get all not featured properties
      await Property.find({ is_featured: false }).lean();

  console.log(
    "🔍 Query:",
    maxProperties ? "Featured (true)" : "Not Featured (false)"
  );
  console.log("📊 Properties found:", properties.length);
  console.log("🏠 First property:", properties[0]);

  //sort properties by date
  // properties.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Convert MongoDB ObjectIds to strings for serialization
  const serializedProperties = properties.map((property) => ({
    // spread all properties
    ...property,
    // Convert ObjectId to string
    _id: property._id.toString(),
  }));

  //limit of properties
  const limitedProperties = serializedProperties.slice(0, maxProperties);

  return (
    <div className="">
      {/* Pass server-fetched properties to client component */}
      <HomeProperties initialProperties={limitedProperties} />
    </div>
  );
};

export default PropertiesPage;
