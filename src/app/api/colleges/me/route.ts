import { NextResponse } from "next/server";
import { requireCollegeAuth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const authRequest = requireCollegeAuth({ headers: request.headers });
    return NextResponse.json({ collegeId: authRequest.collegeId });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
