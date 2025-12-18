import connectToDatabase from "@/config/database";
import Property from "@/models/Property";
import { NextResponse } from "next/server";

export const GET = async (request) => {
  try {
    await connectToDatabase();

    // Get all properties, raw
    const properties = await Property.find({}).lean();

    const debugInfo = properties.map((p) => ({
      _id: p._id,
      idType: typeof p._id,
      isObjectId: p._id && p._id.toString().length === 24, // Simple heuristic
      constructorName: p._id?.constructor?.name,
    }));

    return NextResponse.json({
      count: properties.length,
      sample: debugInfo.slice(0, 10),
      all_ids: debugInfo,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
