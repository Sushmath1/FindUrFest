import { NextResponse } from "next/server";
import { requireCollegeAuth } from "@/lib/auth";
import { createVenue, getVisitorSchedule } from "@/lib/backend";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireCollegeAuth({ headers: request.headers });
    const { id } = await params;

    if (auth.collegeId !== id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { name, xPercent, yPercent } = body as {
      name?: string;
      xPercent?: number;
      yPercent?: number;
    };

    if (!name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const venue = createVenue({ collegeId: id, name, xPercent, yPercent });
    return NextResponse.json({ venue });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
