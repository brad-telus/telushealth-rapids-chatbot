import {apiKey, createBasepathPath} from "@/lib/utils";

// ForgeRock OAuth Configuration
const FORGEROCK_CLIENT_ID = process.env.FORGEROCK_CLIENT_ID || "";
const FORGEROCK_CLIENT_SECRET = process.env.FORGEROCK_CLIENT_SECRET || "";
const FORGEROCK_ISSUER = process.env.FORGEROCK_ISSUER || "";
const DISCOVERY_URI = `${FORGEROCK_ISSUER}/.well-known/openid-configuration`;

// Cache for OpenID configuration
let oidcConfig: any = null;

// Redirect URIs
const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";
const REDIRECT_URI = `${BASE_URL}${apiKey("/api/auth/callback/forgerock")}`
const LOGOUT_REDIRECT_URI = `${BASE_URL}${createBasepathPath("/")}`;

// Fetch OpenID configuration
const getOidcConfig = async () => {
    if (oidcConfig) {
        return oidcConfig;
    }

    try {
        const response = await fetch(DISCOVERY_URI);
        if (!response.ok) {
            throw new Error(`Failed to fetch OIDC config: ${response.status}`);
        }
        oidcConfig = await response.json();
        return oidcConfig;
    } catch (error) {
        console.error("Error fetching OIDC configuration:", error);
        throw error;
    }
};

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
export const getAuthorizationUrl = async (state: string = ""): Promise<string> => {
    if (!validateConfig()) {
        throw new Error("ForgeRock configuration is invalid");
    }

    const config = await getOidcConfig();

    const params = new URLSearchParams({
        client_id: FORGEROCK_CLIENT_ID,
        response_type: "code",
        scope: "openid profile email",
        redirect_uri: REDIRECT_URI,
        state: state || Math.random().toString(36).substring(2, 15),
    });

    return `${config.authorization_endpoint}?${params.toString()}`;
};

// Exchange authorization code for tokens
export const exchangeCodeForTokens = async (code: string): Promise<any> => {
    if (!validateConfig()) {
        throw new Error("ForgeRock configuration is invalid");
    }

    const config = await getOidcConfig();

    // Use client_secret_post method as specified in ForgeRock config
    const body = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        client_id: FORGEROCK_CLIENT_ID,
        client_secret: FORGEROCK_CLIENT_SECRET,
    });

    try {
        const response = await fetch(config.token_endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: body.toString(),
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

    const config = await getOidcConfig();

    try {
        const response = await fetch(config.userinfo_endpoint, {
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

    const config = await getOidcConfig();

    const params = new URLSearchParams({
        id_token_hint: idToken,
        post_logout_redirect_uri: LOGOUT_REDIRECT_URI,
    });

    return `${config.end_session_endpoint}?${params.toString()}`;
};

// Refresh access token
export const refreshAccessToken = async (refreshToken: string): Promise<any> => {
    if (!validateConfig()) {
        throw new Error("ForgeRock configuration is invalid");
    }

    const config = await getOidcConfig();

    const body = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: FORGEROCK_CLIENT_ID,
        client_secret: FORGEROCK_CLIENT_SECRET,
    });

    try {
        const response = await fetch(config.token_endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: body.toString(),
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