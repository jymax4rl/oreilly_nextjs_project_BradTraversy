import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import ServerProperty from "@/components/dynamicComponents/ServerProperty";
import DynamicProperty from "@/components/dynamicComponents/DynamicProperty";
import { notFound } from "next/navigation";

// SEO metadata (unchanged)
export async function generateMetadata({ params }) {
  await connectToDatabase();
  const property = await Property.findById(params.id).lean();
  if (!property) return { title: "Property Not Found" };
  return {
    title: `${property.name} | Kama Properties`,
    description: property.description?.slice(0, 160),
  };
}

export default async function PropertyPage({ params }) {
  await connectToDatabase();
  const { id } = await params;
  const property = await Property.findById(id, "-internalNotes").lean();

  if (!property) {
    notFound();
  }

  // Serialize for client component
  const serialized = {
    ...property,
    _id: property._id.toString(),
    owner: property.owner?.toString?.() || property.owner,
  };

  const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/properties/${params.id}`;

  return (
    <div>
      <HomeProperties
        key={`${locationQuery || "all"}-${typeQuery || "all"}`}
        initialProperties={serializedProperties}
        searchQuery={locationQuery || ""}
        typeFilter={typeQuery || ""}
      />
    </div>
  );
}
