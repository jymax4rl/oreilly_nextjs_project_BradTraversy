import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import ServerProperty from "@/components/dynamicComponents/ServerProperty";
import DynamicProperty from "@/components/dynamicComponents/DynamicProperty";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }) {
  await connectToDatabase();
  const { id } = await params; // ← await for Next.js 15+
  const property = await Property.findById(id).lean();
  if (!property) return { title: "Property Not Found" };
  return {
    title: `${property.name} | Kama Properties`,
    description: property.description?.slice(0, 160),
  };
}

export default async function PropertyPage({ params }) {
  await connectToDatabase();
  const { id } = await params; // ← await for Next.js 15+
  const property = await Property.findById(id, "-internalNotes").lean();

  if (!property) {
    notFound();
  }

  const serialized = {
    ...property,
    _id: property._id.toString(),
    owner: property.owner?.toString?.() || property.owner,
  };

  const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/properties/${id}`;

  return (
    <div className="pt-[10vh]">
      {" "}
      {/* ← clears fixed navbar */}
      <ServerProperty property={serialized} canonicalUrl={canonicalUrl} />
      <DynamicProperty property={serialized} />
    </div>
  );
}
