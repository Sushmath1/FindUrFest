import { NextResponse } from "next/server";
import { createCollegeToken, findCollegeByEmail, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const { adminEmail, password } = body as {
    adminEmail?: string;
    password?: string;
  };

  if (!adminEmail || !password) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const account = await findCollegeByEmail(adminEmail);
  if (!account) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await verifyPassword(password, account.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = createCollegeToken({ collegeId: account.collegeId });
  return NextResponse.json({ token, collegeId: account.collegeId });
}
