import {type NextRequest, NextResponse} from "next/server";
import {isForgeRockAuthEnabled} from "./lib/constants";
import {createBasepathUrl} from "./lib/utils";
import {getDefaultSession} from "./app/auth/session-types";

export async function middleware(request: NextRequest) {
    const {pathname} = request.nextUrl;

    /*
     * Playwright starts the dev server and requires a 200 status to
     * begin the tests, so this ensures that the tests can start
     */
    if (pathname.startsWith("/ping")) {
        return new Response("pong", {status: 200});
    }

    // Allow access to authentication routes
    if (pathname.startsWith("/api/auth")) {
        return NextResponse.next();
    }

    // Allow access to login and register pages
    if (pathname === "/login" || pathname === "/register") {
        return NextResponse.next();
    }

    // If ForgeRock auth is disabled, set a default session
    if (!isForgeRockAuthEnabled) {
        console.warn(`WARNING: ForgeRock authentication is disabled. Using default user session.`);

        // Use a fixed UUID for the default user - this will be created on first API call
        const defaultSession = await getDefaultSession();
        const response = NextResponse.next();

        // Set the session cookie
        response.cookies.set("forgerock_session", JSON.stringify(defaultSession), {
            path: "/",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: Math.floor((defaultSession.expiresAt - Date.now()) / 1000) - 300,
            sameSite: "lax",
        });

        return response;
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
    runtime: 'nodejs',
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
