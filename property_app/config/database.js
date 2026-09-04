import mongoose from "mongoose";

/**
 * Cached mongoose connect for Next.js serverless.
 * Atlas Free (M0) pauses after 30 days with zero connections — `/api/health/db`
 * is cron-pinged daily so idle months do not freeze the live site.
 *
 * @returns {Promise<boolean>} true when mongoose is ready for queries.
 * Safe for Docker/CI builds with no MONGODB_URI (avoids find() buffer timeouts).
 */
const connectToDatabase = async () => {
  mongoose.set("strictQuery", true);

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log("No MongoDB URI provided");
    return false;
  }

  if (mongoose.connection.readyState === 1) {
    if (
      mongoose.connection.db &&
      mongoose.connection.db.databaseName !== "KamaProperties"
    ) {
      console.log(
        `Connected to wrong database (${mongoose.connection.db.databaseName}), reconnecting to KamaProperties...`
      );
      await mongoose.disconnect();
    } else {
      console.log("Already connected to MongoDB");
      return true;
    }
  }

  try {
    await mongoose.connect(uri, {
      dbName: "KamaProperties",
    });
    console.log("Connected to MongoDB");
    return true;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    return false;
  }
};

export default connectToDatabase;
