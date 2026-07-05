import { NextResponse } from "next/server";
import { requireCollegeAuth } from "@/lib/auth";
import { updateEvent, getEvent } from "@/lib/backend";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; eventId: string }> }) {
  try {
    const auth = requireCollegeAuth({ headers: request.headers });
    const { id, eventId } = await params;

    if (auth.collegeId !== id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const updates = {
      venueId: body.venueId,
      startTime: body.startTime ? new Date(body.startTime) : undefined,
      endTime: body.endTime ? new Date(body.endTime) : undefined,
      contactName: body.contactName,
      contactNumber: body.contactNumber,
      status: body.status,
    };

    const result = updateEvent({
      eventId,
      collegeId: id,
      updates,
    });

    if (!result.event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ event: result.event, changed: result.changed });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; eventId: string }> }) {
  try {
    const auth = requireCollegeAuth({ headers: request.headers });
    const { id, eventId } = await params;

    if (auth.collegeId !== id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const event = getEvent(eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (new Date(event.endTime) < new Date()) {
      return NextResponse.json({ error: "Cannot cancel an event after it has ended" }, { status: 400 });
    }

    const result = updateEvent({
      eventId,
      collegeId: id,
      updates: { status: "cancelled" },
    });

    return NextResponse.json({ event: result.event });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
