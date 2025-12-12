import mongoose from "mongoose";

const connectToDatabase = async () => {
  // Set strict query to true to prevent unknown field queries
  mongoose.set("strictQuery", true);

  //if the connection is already open, do nothing
  if (mongoose.connection.readyState === 1) {
    console.log("Already connected to MongoDB");
    return;
  }

  //connect to MongoDB
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
  }
};

export default connectToDatabase;
