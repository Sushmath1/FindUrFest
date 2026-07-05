import { NextResponse } from "next/server";
import { createVisitorToken } from "@/lib/auth";
import { migrateGuestRegistrations } from "@/lib/backend";

export async function POST(request: Request) {
  const body = await request.json();
  const { guestSessionId, visitorId } = body as {
    guestSessionId?: string;
    visitorId?: string;
  };

  if (!guestSessionId || !visitorId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const migratedCount = migrateGuestRegistrations(guestSessionId, visitorId);
  const token = createVisitorToken({ visitorId });

  return NextResponse.json({ token, visitorId, migratedCount });
}
