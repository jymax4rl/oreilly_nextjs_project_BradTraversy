import mongoose from "mongoose";
const apiDomain = process.env.MONGODB_URI || null;

const connectToDatabase = async () => {
  // Set strict query to true to prevent unknown field queries
  mongoose.set("strictQuery", true);

  //handle the case where the domain is not available yet
  if (!apiDomain) {
    console.log("No MongoDB URI provided");
    return [];
  }
  //if the connection is already open, do nothing
  if (mongoose.connection.readyState === 1) {
    if (
      mongoose.connection.db &&
      mongoose.connection.db.databaseName !== "KamaProperties"
    ) {
      console.log(
        `Connected to wrong database (${mongoose.connection.db.databaseName}), reconnecting to KamaProperties...`
      );
      await mongoose.disconnect();
      // Fall through to connect logic
    } else {
      console.log("Already connected to MongoDB");
      return;
    }
  }

  //connect to MongoDB
  try {
    await mongoose.connect(apiDomain, {
      //specify the database name
      dbName: "KamaProperties",
    });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
  }
};

//exporting connection logic
export default connectToDatabase;
