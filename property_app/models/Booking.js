import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },
    guestId: {
      type: String,
      required: true,
      index: true,
    },
    guestName: { type: String },
    guestEmail: { type: String },
    checkIn: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    checkOut: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
      index: true,
    },
    transactionId: {
      type: Number,
      sparse: true,
      unique: true,
    },
    propertyName: { type: String },
    amount: { type: Number },
    currency: { type: String },
  },
  {
    timestamps: true,
    collection: "Bookings",
  },
);

BookingSchema.index({ propertyId: 1, status: 1, checkIn: 1 });

const Booking =
  mongoose.models.Booking || mongoose.model("Booking", BookingSchema);

export default Booking;
