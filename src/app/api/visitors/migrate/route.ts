import { NextResponse } from "next/server";
import { createVisitorToken, getVisitorContext, migrateGuestSelections, registerVisitorAccount } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password, guestSessionId } = body as {
    email?: string;
    password?: string;
    guestSessionId?: string;
  };

  if (!email || !password || !guestSessionId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const account = await registerVisitorAccount({ email, password });
  await migrateGuestSelections(guestSessionId, account.visitorId);
  const token = createVisitorToken({ visitorId: account.visitorId });

  return NextResponse.json({ token, visitorId: account.visitorId });
}
