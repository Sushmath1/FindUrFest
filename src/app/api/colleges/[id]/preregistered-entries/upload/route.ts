import { NextResponse } from "next/server";
import { requireCollegeAuth } from "@/lib/auth";
import { createPreRegisteredEntry, listCollegeEvents } from "@/lib/backend";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireCollegeAuth({ headers: request.headers });
    const { id } = await params;

    if (auth.collegeId !== id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Missing CSV upload" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const rows = lines.slice(1);
    const createdEntries = [] as Array<{ email?: string | null; phone?: string | null; eventId?: string; matchedEvent: boolean }>;
    const unmatchedRows = [] as Array<{ row: string; reason: string }>;
    const events = listCollegeEvents(id);

    for (const line of rows) {
      const [rawIdentifier, rawEventName] = line.split(",");
      if (!rawIdentifier || !rawEventName) {
        continue;
      }

      const normalizedEmail = rawIdentifier.includes("@") ? rawIdentifier.trim().toLowerCase() : null;
      const normalizedPhone = normalizedEmail ? null : rawIdentifier.replace(/\D/g, "");
      const eventName = rawEventName.trim();
      const matchedEvent = events.find((event) => event.name.toLowerCase() === eventName.toLowerCase());

      if (!matchedEvent) {
        unmatchedRows.push({ row: line, reason: `No event named ${eventName}` });
        continue;
      }

      const entry = createPreRegisteredEntry({
        collegeId: id,
        eventId: matchedEvent.id,
        email: normalizedEmail,
        phone: normalizedPhone,
      });

      createdEntries.push({ email: entry.email, phone: entry.phone, eventId: entry.eventId, matchedEvent: true });
    }

    return NextResponse.json({ createdEntries, count: createdEntries.length, unmatchedRows });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
