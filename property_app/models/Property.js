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
    type: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    location: {
      street: {
        type: String,
      },
      city: {
        type: String,
      },
      state: {
        type: String,
      },
      zipcode: {
        type: String,
      },
      country: {
        type: String,
      },
    },
    beds: {
      type: Number,
      required: true,
    },
    baths: {
      type: Number,
      required: true,
    },
    square_feet: {
      type: Number,
      required: true,
    },
    amenities: [
      {
        type: String,
      },
    ],
    rates: {
      nightly: {
        type: Number,
      },
      weekly: {
        type: Number,
      },
      monthly: {
        type: Number,
      },
    },
    seller_info: {
      name: {
        type: String,
      },
      email: {
        type: String,
      },
      phone: {
        type: String,
      },
    },
    images: [
      {
        type: String,
      },
    ],
    audio: {
      type: String,
      required: false,
    },
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

  mongoose.models.Property || mongoose.model("Property", PropertySchema);

export default Property;
