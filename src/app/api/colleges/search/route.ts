import { NextResponse } from "next/server";
import { listColleges } from "@/lib/backend";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  return NextResponse.json({ colleges: listColleges(q) });
}
