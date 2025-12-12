import connectToDatabase from "@/config/database";
import Property from "@/models/Property";

export const GET = async (request) => {
  try {
    await connectToDatabase();
    const properties = await Property.find({});
    return new Response(JSON.stringify({ properties }), {
      status: 200,
    });
  } catch (error) {
    console.log(error);
    return new Response("Internal Server Error", { status: 500 });
  }
};
