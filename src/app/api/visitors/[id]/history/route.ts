import { NextResponse } from "next/server";
import { getVisitorContext } from "@/lib/auth";
import { getVisitorHistory } from "@/lib/backend";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = getVisitorContext({ headers: request.headers });

  if (!context.visitorId || context.visitorId !== id) {
    return NextResponse.json({ error: "Log in to see your history" }, { status: 401 });
  }

  return NextResponse.json({ history: getVisitorHistory(id) });
}
