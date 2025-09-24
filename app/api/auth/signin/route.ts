import { NextRequest, NextResponse } from "next/server";
import { getAuthorizationUrl } from "@/app/auth/forgerock";
import { createRedirectUrl } from "@/lib/utils";

export async function GET(request: NextRequest) {
  // Get the callback URL from the query parameters
  const searchParams = request.nextUrl.searchParams;
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  
  // Get the provider from the query parameters
  const provider = searchParams.get("provider");
  
  // Only support ForgeRock provider
  if (provider && provider !== "forgerock") {
    return NextResponse.redirect(
      new URL(createRedirectUrl("/login", request.url))
    );
  }
  
  try {
    // Generate a state parameter to prevent CSRF attacks
    const state = Buffer.from(JSON.stringify({ callbackUrl })).toString("base64");

    // Generate the authorization URL (now async)
    const authorizationUrl = await getAuthorizationUrl(state);

    // Redirect to the authorization URL
    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    console.error("Error generating authorization URL:", error);
    
    // Redirect to login page with error
    return NextResponse.redirect(
      new URL(
        createRedirectUrl(`/login?error=${encodeURIComponent("Failed to authenticate with ForgeRock")}`, request.url)
      )
    );
  }
}