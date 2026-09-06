import { Schema, models, model } from "mongoose";
//tested
const TransactionSchema = new Schema(
  {
    /**
     * Provider payment id (Flutterwave id, Creem checkout id, or GeniusPay reference).
     * Stored as string so Creem and Flutterwave share one unique key.
     */
    transaction_id: {
      type: String,
      required: true,
      unique: true,
    },
    /** flutterwave | creem | geniuspay */
    provider: {
      type: String,
      enum: ["flutterwave", "creem", "geniuspay"],
      default: "flutterwave",
      index: true,
    },
    tx_ref: {
      type: String,
      required: true,
    },
    /** Flutterwave flw_ref; optional for Creem (use provider_ref). */
    flw_ref: {
      type: String,
      required: false,
    },
    /** Provider-native reference (Creem order id, Flutterwave flw_ref, etc.). */
    provider_ref: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    customer_name: {
      type: String,
    },
    customer_email: {
      type: String,
    },
    charge_response_code: {
      type: String,
    },
    charge_response_message: {
      type: String,
    },
    flutterwave_created_at: {
      type: Date,
    },
    /** Snapshot of platform fee / host share at charge time (USD). */
    platform_fee: {
      type: Number,
    },
    host_payout: {
      type: Number,
    },
    cleaning_fee: {
      type: Number,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    property_id: {
      type: Schema.Types.ObjectId,
      ref: "Property",
    },
    property_name: {
      type: String,
    },
    host_id: {
      type: String,
    },
    host_name: {
      type: String,
    },
    host_email: {
      type: String,
    },
    check_in: {
      type: String,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    check_out: {
      type: String,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    nights: {
      type: Number,
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
    },
  },
  {
    timestamps: true,
  },
);

// Bust Mongoose cache in development so schema changes reflect immediately
if (models.Transaction) {
  delete models.Transaction;
}
const Transaction = model("Transaction", TransactionSchema);
export default Transaction;
