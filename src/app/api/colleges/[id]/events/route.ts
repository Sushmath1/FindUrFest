import { NextResponse } from "next/server";
import { requireCollegeAuth } from "@/lib/auth";
import { createEvent, listCollegeEvents } from "@/lib/backend";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? undefined;
  return NextResponse.json({ events: listCollegeEvents(id, date) });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireCollegeAuth({ headers: request.headers });
    const { id } = await params;

    if (auth.collegeId !== id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { name, venueId, startTime, endTime, contactName, contactNumber } = body as {
      name?: string;
      venueId?: string;
      startTime?: string;
      endTime?: string;
      contactName?: string | null;
      contactNumber?: string | null;
    };

    if (!name || !venueId || !startTime || !endTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const event = createEvent({
      collegeId: id,
      venueId,
      name,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      contactName,
      contactNumber,
    });

    return NextResponse.json({ event });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
