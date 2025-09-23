import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { signIn } from "@/app/(auth)/auth";
import { isDevelopmentEnvironment } from "@/lib/constants";
import { createBasepathUrl } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUrl = searchParams.get("redirectUrl");

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  if (token) {
    // If user is already authenticated, redirect to the requested URL or home
    const targetUrl = redirectUrl
      ? createBasepathUrl(redirectUrl, request.url)
      : createBasepathUrl("/", request.url);
    return NextResponse.redirect(new URL(targetUrl));
  }

  // For guest sign-in, use NextAuth.js without automatic redirect
  // Then manually redirect to avoid basePath issues
  try {
    await signIn("guest", { redirect: false });
    const targetUrl = redirectUrl
      ? createBasepathUrl(redirectUrl, request.url)
      : createBasepathUrl("/", request.url);
    return NextResponse.redirect(new URL(targetUrl));
  } catch (error) {
    console.error("Guest sign-in error:", error);
    // Fallback to home page
    return NextResponse.redirect(new URL(createBasepathUrl("/", request.url)));
  }
}
