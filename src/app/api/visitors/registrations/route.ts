import { NextResponse } from "next/server";
import { createRegistrationBatch } from "@/lib/backend";

export async function POST(request: Request) {
  const body = await request.json();
  const { visitorOrGuestId, eventIds } = body as {
    visitorOrGuestId?: string;
    eventIds?: string[];
  };

  if (!visitorOrGuestId || !Array.isArray(eventIds) || eventIds.length === 0) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const registrations = createRegistrationBatch({ visitorOrGuestId, eventIds });
  return NextResponse.json({ registrations });
}
