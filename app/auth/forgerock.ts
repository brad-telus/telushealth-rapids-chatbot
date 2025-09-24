import {createBasepathPath} from "@/lib/utils";

// ForgeRock OAuth Configuration
const FORGEROCK_CLIENT_ID = process.env.FORGEROCK_CLIENT_ID || "";
const FORGEROCK_CLIENT_SECRET = process.env.FORGEROCK_CLIENT_SECRET || "";
const FORGEROCK_ISSUER = process.env.FORGEROCK_ISSUER || "";
const DISCOVERY_URI = `${FORGEROCK_ISSUER}/.well-known/openid-configuration`;

// Redirect URIs
const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";
const REDIRECT_URI = `${BASE_URL}${createBasepathPath("/api/auth/callback/forgerock")}`;
const LOGOUT_REDIRECT_URI = `${BASE_URL}${createBasepathPath("/")}`;

// Validate required ForgeRock environment variables
const validateConfig = () => {
    const missingEnvVars = [];
    if (!FORGEROCK_ISSUER)
        missingEnvVars.push('FORGEROCK_ISSUER');
    if (!FORGEROCK_CLIENT_ID)
        missingEnvVars.push('FORGEROCK_CLIENT_ID');
    if (!FORGEROCK_CLIENT_SECRET)
        missingEnvVars.push('FORGEROCK_CLIENT_SECRET');

    if (missingEnvVars.length > 0) {
        console.error(`Missing required ForgeRock environment variables: ${missingEnvVars.join(', ')}`);
        return false;
    }
    return true;
};

// Generate the authorization URL
export const getAuthorizationUrl = (state: string = ""): string => {
    if (!validateConfig()) {
        throw new Error("ForgeRock configuration is invalid");
    }

    const params = new URLSearchParams({
        client_id: FORGEROCK_CLIENT_ID,
        response_type: "code",
        scope: "openid profile email",
        redirect_uri: REDIRECT_URI,
        state: state || Math.random().toString(36).substring(2, 15),
    });

    return `${FORGEROCK_ISSUER}/authorize?${params.toString()}`;
};

// Exchange authorization code for tokens
export const exchangeCodeForTokens = async (code: string): Promise<any> => {
    if (!validateConfig()) {
        throw new Error("ForgeRock configuration is invalid");
    }

    const params = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        client_id: FORGEROCK_CLIENT_ID,
        client_secret: FORGEROCK_CLIENT_SECRET,
    });

    try {
        const response = await fetch(`${FORGEROCK_ISSUER}/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to exchange code for tokens: (${response.status}) ${error}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error exchanging code for tokens:", error);
        throw error;
    }
};

// Get user info from access token
export const getUserInfo = async (accessToken: string): Promise<any> => {
    if (!validateConfig()) {
        throw new Error("ForgeRock configuration is invalid");
    }

    try {
        const response = await fetch(`${FORGEROCK_ISSUER}/userinfo`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to get user info: ${error}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error getting user info:", error);
        throw error;
    }
};

// Logout user
export const logout = async (idToken: string): Promise<string> => {
    if (!validateConfig()) {
        throw new Error("ForgeRock configuration is invalid");
    }

    const params = new URLSearchParams({
        id_token_hint: idToken,
        post_logout_redirect_uri: LOGOUT_REDIRECT_URI,
    });

    return `${FORGEROCK_ISSUER}/logout?${params.toString()}`;
};

// Refresh access token
export const refreshAccessToken = async (refreshToken: string): Promise<any> => {
    if (!validateConfig()) {
        throw new Error("ForgeRock configuration is invalid");
    }

    const params = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: FORGEROCK_CLIENT_ID,
        client_secret: FORGEROCK_CLIENT_SECRET,
    });

    try {
        const response = await fetch(`${FORGEROCK_ISSUER}/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to refresh access token: ${error}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error refreshing access token:", error);
        throw error;
    }
};