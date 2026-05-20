import mongoose from "mongoose";

const BookingEventSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["created", "modified", "cancelled"],
      required: true,
    },
    actorId: { type: String, required: true },
    actorRole: {
      type: String,
      enum: ["guest", "host", "admin"],
      required: true,
    },
    payload: { type: mongoose.Schema.Types.Mixed },
  },
  {
    timestamps: true,
    collection: "BookingEvents",
  },
);

const BookingEvent =
  mongoose.models.BookingEvent ||
  mongoose.model("BookingEvent", BookingEventSchema);

export default BookingEvent;
