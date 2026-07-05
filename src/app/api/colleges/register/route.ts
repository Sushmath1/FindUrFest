import { NextResponse } from "next/server";
import { registerCollegeAccount, createCollegeToken } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const { collegeId, adminEmail, password } = body as {
    collegeId?: string;
    adminEmail?: string;
    password?: string;
  };

  if (!collegeId || !adminEmail || !password) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  await registerCollegeAccount({ collegeId, adminEmail, password });
  const token = createCollegeToken({ collegeId });

  return NextResponse.json({ token, collegeId });
}
