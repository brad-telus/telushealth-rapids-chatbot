import { type NextRequest, NextResponse } from "next/server";
import { isDevelopmentEnvironment } from "./lib/constants";
import { createBasepathUrl } from "./lib/utils";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  // Allow access to authentication routes
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Allow access to login and register pages
  if (pathname === "/login" || pathname === "/register") {
    return NextResponse.next();
  }

  // Check if the user is authenticated by checking the session cookie
  const sessionCookie = request.cookies.get("forgerock_session");
  const isAuthenticated = !!sessionCookie?.value;

  // If the user is not authenticated, redirect to the login page
  if (!isAuthenticated) {
    const callbackUrl = encodeURIComponent(request.url);
    return NextResponse.redirect(
      new URL(
        createBasepathUrl(
          `/login?callbackUrl=${callbackUrl}`,
          request.url
        )
      )
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/chat/:id",
    "/api/:path*",

    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
