import { NextResponse } from "next/server";
import { createVisitorToken, registerVisitorAccount } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const account = await registerVisitorAccount({ email, password });
  const token = createVisitorToken({ visitorId: account.visitorId });

  return NextResponse.json({ token, visitorId: account.visitorId });
}
