import mongoose from "mongoose";

/**
 * Run work inside a MongoDB transaction when the deployment supports it.
 * Falls back to non-transactional execution on standalone/local MongoDB.
 */
export async function runWithTransaction(work) {
  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    const result = await work(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    if (session?.inTransaction()) {
      await session.abortTransaction();
    }
    if (isTransactionNotSupported(error)) {
      return work(null);
    }
    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }
}

function isTransactionNotSupported(error) {
  const msg = error?.message || "";
  return (
    msg.includes("Transaction numbers are only allowed") ||
    msg.includes("replica set") ||
    msg.includes("mongos")
  );
}
