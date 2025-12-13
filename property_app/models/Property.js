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
    // Add other fields relevant to your Airbnb clone (price, description, etc.)
  },
  {
    timestamps: true,
    collection: "Properties", // FORCE Mongoose to look for "Properties" (Capitalized)
  }
);

// Check if model exists to prevent "OverwriteModelError" in Next.js
const Property =
  mongoose.models.Property || mongoose.model("Property", PropertySchema);

export default Property;
