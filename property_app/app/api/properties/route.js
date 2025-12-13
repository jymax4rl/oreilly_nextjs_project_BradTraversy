import connectToDatabase from "@/config/database";
import User from "@/models/User";
import Property from "@/models/Property";

export const GET = async (request) => {
  try {
    // Connect to MongoDB
    await connectToDatabase();
    // Find all properties and convert to plain JavaScript objects
    const properties = await Property.find({}).lean();
    return new Response(JSON.stringify(properties), {
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
