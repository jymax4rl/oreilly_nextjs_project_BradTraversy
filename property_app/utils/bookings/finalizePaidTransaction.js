import Transaction from "@/models/Transaction";
import Property from "@/models/Property";
import User from "@/models/User";
import { confirmBookingFromPayment } from "@/utils/bookings/confirmBooking";
import { sendBookingConfirmationEmails } from "@/utils/email/sendBookingEmails";
import { countNights } from "@/utils/availability/validateStay";
import {
  formatPropertyLocation,
  propertyImageAbsoluteUrl,
} from "@/utils/email/propertyImageUrl";
import { formatPropertyMeta } from "@/utils/email/propertyMeta";

/**
 * Resolve guest user from session id or customer email.
 */
async function resolveGuest({ userId, customerEmail, customerName }) {
  if (userId) {
    return {
      guestId: userId.toString(),
      guestName: customerName,
      guestEmail: customerEmail,
    };
  }
  if (customerEmail) {
    const user = await User.findOne({ email: customerEmail });
    if (user) {
      return {
        guestId: user._id.toString(),
        guestName: customerName || user.username,
        guestEmail: user.email,
      };
    }
  }
  return null;
}

async function sendEmailsForBooking(body, guest, nights) {
  let propertyImageUrl;
  let locationLabel;
  let propertyMeta;
  try {
    const property = await Property.findById(body.property_id)
      .select("images location beds baths type")
      .lean();
    if (property) {
      propertyImageUrl = propertyImageAbsoluteUrl(property.images);
      locationLabel = formatPropertyLocation(property.location);
      propertyMeta = formatPropertyMeta(property, locationLabel);
    }
  } catch (err) {
    console.error("Property lookup for booking email:", err);
  }

  await sendBookingConfirmationEmails({
    guestEmail: guest.guestEmail,
    guestName: guest.guestName,
    hostEmail: body.host_email,
    hostName: body.host_name,
    propertyName: body.property_name || "Property",
    propertyId: body.property_id?.toString?.() ?? body.property_id,
    propertyImageUrl,
    propertyMeta,
    locationLabel,
    checkIn: body.check_in,
    checkOut: body.check_out,
    nights,
    amount: body.amount,
    currency: body.currency,
    transactionId: body.transaction_id,
  });
}

/**
 * Link booking + emails for a saved transaction payload.
 * @param {object} body — transaction fields (property_id, check_in, dates, etc.)
 * @param {{ userId?: string, customerEmail?: string, customerName?: string }} guestHint
 */
export async function attachBookingToTransaction(body, guestHint = {}) {
  const guest = await resolveGuest({
    userId: guestHint.userId,
    customerEmail: guestHint.customerEmail || body.customer_email,
    customerName: guestHint.customerName || body.customer_name,
  });

  if (!body.check_in || !body.check_out || !body.property_id) {
    return { bookingId: null, bookingError: "Missing stay dates on payment" };
  }
  if (!guest) {
    return {
      bookingId: null,
      bookingError: "Sign in required to link booking to your account",
    };
  }

  const bookingResult = await confirmBookingFromPayment({
    propertyId: body.property_id.toString(),
    guestId: guest.guestId,
    guestName: guest.guestName,
    guestEmail: guest.guestEmail,
    checkIn: body.check_in,
    checkOut: body.check_out,
    transactionId: body.transaction_id,
    amount: body.amount,
    currency: body.currency,
    propertyName: body.property_name,
  });

  if (!bookingResult.ok || !bookingResult.booking) {
    return {
      bookingId: null,
      bookingError: bookingResult.error || "Booking could not be created",
    };
  }

  const bookingId = bookingResult.booking._id;
  const nights =
    body.nights ?? bookingResult.nights ?? countNights(body.check_in, body.check_out);

  sendEmailsForBooking(
    { ...body, property_id: body.property_id },
    guest,
    nights,
  ).catch((err) => console.error("Booking email error:", err));

  return { bookingId, bookingError: null, nights };
}

/**
 * After Flutterwave verify: save transaction (idempotent) and create booking.
 */
export async function finalizePaidTransaction(body, guestHint = {}) {
  const existingTx = await Transaction.findOne({
    transaction_id: body.transaction_id,
  });

  if (existingTx) {
    if (existingTx.booking) {
      return {
        transaction: existingTx,
        bookingId: existingTx.booking.toString(),
        bookingError: null,
        created: false,
      };
    }

    const attach = await attachBookingToTransaction(
      {
        transaction_id: existingTx.transaction_id,
        property_id: existingTx.property_id,
        property_name: existingTx.property_name,
        host_email: existingTx.host_email,
        host_name: existingTx.host_name,
        check_in: existingTx.check_in,
        check_out: existingTx.check_out,
        nights: existingTx.nights,
        amount: existingTx.amount,
        currency: existingTx.currency,
        customer_email: existingTx.customer_email,
        customer_name: existingTx.customer_name,
      },
      {
        userId: existingTx.user?.toString() || guestHint.userId,
        customerEmail: existingTx.customer_email,
        customerName: existingTx.customer_name,
      },
    );

    if (attach.bookingId) {
      existingTx.booking = attach.bookingId;
      await existingTx.save();
    }

    return {
      transaction: existingTx,
      bookingId: attach.bookingId?.toString?.() ?? attach.bookingId,
      bookingError: attach.bookingError,
      created: false,
    };
  }

  const newTransaction = await Transaction.create({
    transaction_id: body.transaction_id,
    tx_ref: body.tx_ref,
    flw_ref: body.flw_ref,
    amount: body.amount,
    currency: body.currency,
    status: body.status || "successful",
    customer_name: guestHint.customerName || body.customer_name,
    customer_email: guestHint.customerEmail || body.customer_email,
    charge_response_code: body.charge_response_code,
    charge_response_message: body.charge_response_message,
    flutterwave_created_at: body.flutterwave_created_at || new Date(),
    user: guestHint.userId || null,
    property_id: body.property_id || null,
    property_name: body.property_name,
    host_id: body.host_id,
    host_name: body.host_name,
    host_email: body.host_email,
    check_in: body.check_in,
    check_out: body.check_out,
    nights: body.nights,
  });

  const attach = await attachBookingToTransaction(
    {
      transaction_id: newTransaction.transaction_id,
      property_id: newTransaction.property_id,
      property_name: newTransaction.property_name,
      host_email: newTransaction.host_email,
      host_name: newTransaction.host_name,
      check_in: newTransaction.check_in,
      check_out: newTransaction.check_out,
      nights: newTransaction.nights,
      amount: newTransaction.amount,
      currency: newTransaction.currency,
      customer_email: newTransaction.customer_email,
      customer_name: newTransaction.customer_name,
    },
    guestHint,
  );

  if (attach.bookingId) {
    newTransaction.booking = attach.bookingId;
    await newTransaction.save();
  }

  return {
    transaction: newTransaction,
    bookingId: attach.bookingId?.toString?.() ?? attach.bookingId,
    bookingError: attach.bookingError,
    created: true,
  };
}

/**
 * Webhook path: transaction already verified by Flutterwave API.
 */
export async function finalizeFromFlutterwaveCharge(data) {
  const transactionId = data.id;
  const body = {
    transaction_id: transactionId,
    tx_ref: data.tx_ref,
    flw_ref: data.flw_ref || data.reference || String(transactionId),
    amount: data.amount,
    currency: data.currency,
    status: data.status,
    customer_name: data.customer?.name,
    customer_email: data.customer?.email,
    flutterwave_created_at: data.created_at ? new Date(data.created_at) : new Date(),
    property_id: data.meta?.property_id,
    property_name: data.meta?.property_name,
    host_id: data.meta?.host_id,
    host_name: data.meta?.host_name,
    host_email: data.meta?.host_email,
    check_in: data.meta?.check_in,
    check_out: data.meta?.check_out,
    nights: data.meta?.nights != null ? Number(data.meta.nights) : undefined,
  };

  return finalizePaidTransaction(body, {
    customerEmail: body.customer_email,
    customerName: body.customer_name,
  });
}
