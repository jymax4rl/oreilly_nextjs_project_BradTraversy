import connectToDatabase from "@/config/database";
import Transaction from "@/models/Transaction";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/authOptions";

export const GET = async (request) => {
  try {
    await connectToDatabase();
    
    const session = await getServerSession(authOptions);

    // Security Check: Only admins can access this route
    if (!session || session.user.role !== "admin") {
      return new Response("Unauthorized", { status: 401 });
    }

    // Get search query if present
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const query = searchParams.get("query") || "";

    // Build filter object based on search query
    let filter = {};
    if (query) {
      filter = {
        $or: [
          { tx_ref: { $regex: query, $options: "i" } },
          { customer_name: { $regex: query, $options: "i" } },
          { customer_email: { $regex: query, $options: "i" } },
        ]
      };
      // If query is numeric, also search transaction_id exactly
      if (!isNaN(query)) {
        filter.$or.push({ transaction_id: Number(query) });
      }
    }

    // Fetch transactions
    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .populate("user", "username email image")
      .lean();

    return Response.json({ transactions });
  } catch (error) {
    console.error("Fetch transactions error:", error);
    return new Response("Failed to fetch transactions", { status: 500 });
  }
};
