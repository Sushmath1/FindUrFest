import { NextResponse } from "next/server";
import { getVisitorContext, getVisitorHistory } from "@/lib/auth";

export async function GET(request: Request) {
  const context = getVisitorContext({ headers: request.headers });

  if (!context.visitorId) {
    return NextResponse.json(
      { message: "Log in to see your past fests", requiresAuth: true },
      { status: 200 }
    );
  }

  return NextResponse.json({ history: getVisitorHistory(context) });
}
