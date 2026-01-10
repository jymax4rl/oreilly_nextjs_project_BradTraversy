import connectToDatabase from "@/config/database";
import User from "@/models/User";
import Property from "@/models/Property";

// export const GET = async (request, { params }) => {
//   try {
//     // Connect to MongoDB
//     await connectToDatabase();
//     // Find all properties and convert to plain JavaScript objects
//     const { id } = await params;
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
