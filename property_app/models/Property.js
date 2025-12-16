import { Schema, model, models, mongoose } from "mongoose";

const PropertySchema = new mongoose.Schema(
  {
    // You can define specific fields here (e.g., name: String),
    // or leave it empty temporarily if you just want to dump all data.
    name: {
      type: String,
      required: false,
    },
    owner: {
      type: String,
      required: false,
    },
    is_featured: {
      type: Boolean,
      required: true,
      default: false,
    },
    // Add other fields relevant to your Airbnb clone (price, description, etc.)
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    strict: false, // Allow fields not in schema
    collection: "Properties", // FORCE Mongoose to look for "Properties" (Capitalized)
  }
);

// Check if model exists to prevent "OverwriteModelError" in Next.js
const Property =
  //check if the model exists in the mongoose models collection
  //if it does not exist, create it
  mongoose.models.Property || mongoose.model("Properties", PropertySchema);

export default Property;
