import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/config/database";

export const dynamic = "force-dynamic";

/**
 * Atlas Free clusters pause after 30 days with zero connections.
 * Vercel Cron hits this daily so the marketplace still answers after a quiet month.
 */
export async function GET() {
  const ok = await connectToDatabase();
  if (!ok || mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    return NextResponse.json({ ok: false, db: "down" }, { status: 503 });
  }

  try {
    await mongoose.connection.db.admin().command({ ping: 1 });
    return NextResponse.json({ ok: true, db: "up" });
  } catch {
    return NextResponse.json({ ok: false, db: "down" }, { status: 503 });
  }
}
