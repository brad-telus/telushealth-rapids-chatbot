import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/auth/session";

export async function GET(request: NextRequest) {
  // Get the session from the cookie
  const session = await getSession();

  // Return the session as JSON
  return NextResponse.json(session);
}
