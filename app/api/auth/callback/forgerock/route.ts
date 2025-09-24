import {NextRequest, NextResponse} from "next/server";
import {exchangeCodeForTokens, getUserInfo} from "@/app/auth/forgerock";
import {setSession} from "@/app/auth/session";
import {createBasepathPath} from "@/lib/utils";

export async function GET(request: NextRequest) {
    // Get the authorization code from the query parameters
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle error from ForgeRock
    if (error) {
        console.error("ForgeRock authentication error:", error);
        return NextResponse.redirect(
            new URL(
                createBasepathPath(`/login?error=${encodeURIComponent("Authentication failed")}`),
                request.url
            )
        );
    }

    // Validate required parameters
    if (!code) {
        console.error("Missing authorization code");
        return NextResponse.redirect(
            new URL(
                createBasepathPath(`/login?error=${encodeURIComponent("Missing authorization code")}`),
                request.url
            )
        );
    }

    try {
        // Exchange the authorization code for tokens
        const tokens = await exchangeCodeForTokens(code);

        // Get user info from access token
        const userInfo = await getUserInfo(tokens.access_token);

        // Parse the state parameter to get the callback URL
        let callbackUrl = "/";
        if (state) {
            try {
                const stateData = JSON.parse(Buffer.from(state, "base64").toString());
                callbackUrl = stateData.callbackUrl || "/";
            } catch (error) {
                console.error("Error parsing state parameter:", error);
            }
        }

        // Calculate token expiration time
        const expiresAt = Date.now() + tokens.expires_in * 1000;

        // Set the session cookie
        await setSession({
            user: {
                id: userInfo.sub,
                email: userInfo.email,
                name: userInfo.name || userInfo.preferred_username,
            },
            accessToken: tokens.access_token,
            idToken: tokens.id_token,
            refreshToken: tokens.refresh_token,
            expiresAt,
        });

        // Redirect to the callback URL
        return NextResponse.redirect(new URL(createBasepathPath(callbackUrl), request.url));
    } catch (error) {
        console.error("Error handling ForgeRock callback:", error);

        // Redirect to login page with error
        return NextResponse.redirect(
            new URL(
                createBasepathPath(`/login?error=${encodeURIComponent("Failed to authenticate with ForgeRock")}`),
                request.url
            )
        );
    }
}
