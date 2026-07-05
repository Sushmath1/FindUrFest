import { NextResponse } from "next/server";
import { getVisitorSchedule } from "@/lib/backend";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json(getVisitorSchedule(id));
}
