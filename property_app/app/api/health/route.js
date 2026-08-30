import { NextResponse } from "next/server";

/**
 * Lightweight liveness probe for container orchestration.
 * Does not touch MongoDB or external APIs.
 * Prefer APP_VERSION (Docker build-arg / compose) when present.
 */
export async function GET() {
  const version = process.env.APP_VERSION || "1.1.0";
  return NextResponse.json(
    { status: "ok", service: "property_app", version },
    { status: 200 },
  );
}
