import { Schema, models, model } from "mongoose";

const TransactionSchema = new Schema(
  {
    transaction_id: {
      type: Number,
      required: true,
      unique: true,
    },
    tx_ref: {
      type: String,
      required: true,
    },
    flw_ref: {
      type: String,
      required: true,
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
  },
  {
    timestamps: true,
  }
);

// Bust Mongoose cache in development so schema changes reflect immediately
if (models.Transaction) {
  delete models.Transaction;
}
const Transaction = model("Transaction", TransactionSchema);
export default Transaction;
