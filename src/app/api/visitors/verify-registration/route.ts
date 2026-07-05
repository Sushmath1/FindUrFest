import { NextResponse } from "next/server";
import { verifyRegistration } from "@/lib/backend";

export async function POST(request: Request) {
  const body = await request.json();
  const { visitorOrGuestId, collegeId, email, phone } = body as {
    visitorOrGuestId?: string;
    collegeId?: string;
    email?: string;
    phone?: string;
  };

  if (!visitorOrGuestId || !collegeId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const result = verifyRegistration({ visitorOrGuestId, collegeId, email, phone });
  if (result.createdCount === 0) {
    return NextResponse.json({
      error: "No registered events matched that email or phone. Please double-check the details or try the other field.",
    }, { status: 404 });
  }

  return NextResponse.json(result);
}
