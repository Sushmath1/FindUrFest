import { NextResponse } from "next/server";
import { createVisitorToken, findVisitorByEmail, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const account = await findVisitorByEmail(email);
  if (!account) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await verifyPassword(password, account.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = createVisitorToken({ visitorId: account.visitorId });
  return NextResponse.json({ token, visitorId: account.visitorId });
}
