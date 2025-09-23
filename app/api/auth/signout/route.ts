import { NextRequest, NextResponse } from "next/server";
import { logout } from "@/app/auth/forgerock";
import { clearSession, getSession } from "@/app/auth/session";
import { createBasepathPath } from "@/lib/utils";

export async function GET(request: NextRequest) {
  // Get the callback URL from the query parameters
  const searchParams = request.nextUrl.searchParams;
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  // Get the session from the cookie
  const session = await getSession();

  // Clear the session cookie
  await clearSession();

  // If there's no session, just redirect to the callback URL
  if (!session) {
    return NextResponse.redirect(new URL(createBasepathPath(callbackUrl), request.url));
  }

  try {
    // Get the ForgeRock logout URL
    const logoutUrl = await logout(session.idToken);

    // Redirect to the ForgeRock logout URL
    return NextResponse.redirect(logoutUrl);
  } catch (error) {
    console.error("Error logging out from ForgeRock:", error);

    // If there's an error, just redirect to the callback URL
    return NextResponse.redirect(new URL(createBasepathPath(callbackUrl), request.url));
  }
}
