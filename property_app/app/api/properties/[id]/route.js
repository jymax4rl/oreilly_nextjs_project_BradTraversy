import connectToDatabase from "@/config/database";
import User from "@/models/User";
import Property from "@/models/Property";
import { notFound } from "next/navigation";
// export const GET = async (request, { params }) => {
//   try {
//     // Connect to MongoDB
//     await connectToDatabase();
//     // Find all properties and convert to plain JavaScript objects
//     const { id } = params;
//     const properties = await Property.findById(id);
//     return new Response(JSON.stringify(properties), {
//       status: 200,
//       headers: {
//         "Content-Type": "application/json",
//       },
//     });
//   } catch (error) {
//     console.log(error);
//     return new Response("Internal Server Error", { status: 404 });
//   }
// };
export async function generateMetadata({ params }) {
  const { id } = params;

  await connectToDatabase();
  const property = await Property.findById(id).lean();

  if (!property) {
    return notFound();
  }

  return {
    title: `${property.title} | Aplica`,
    description: property.description,
    openGraph: {
      title: property.title,
      description: property.description,
      images: property.images?.length ? [property.images[0]] : [],
    },
  };
}

export const POST = async (request, { params }) => {
  try {
    return new Response(JSON.stringify({ message: "Property created" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.log(error);
    return new Response("Internal Server Error", { status: 500 });
  }
};
