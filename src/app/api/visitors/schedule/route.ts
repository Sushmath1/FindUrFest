import { NextResponse } from "next/server";
import { addVisitorSelection, getVisitorContext, getVisitorSelections, recordVisitorHistory } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const { eventName } = body as { eventName?: string };

  if (!eventName) {
    return NextResponse.json({ error: "Missing eventName" }, { status: 400 });
  }

  const context = getVisitorContext({ headers: request.headers });
  const selections = addVisitorSelection(context, eventName);
  recordVisitorHistory(context, eventName);

  return NextResponse.json({ selections, context });
}

export async function GET(request: Request) {
  const context = getVisitorContext({ headers: request.headers });
  const selections = getVisitorSelections(context);

  return NextResponse.json({ selections, context });
}
