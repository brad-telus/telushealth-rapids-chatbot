import {apiKey} from "@/lib/utils";
import {DEFAULT_EMAIL, DEFAULT_USER_ID} from "@/lib/constants";

// Session cookie name
export const SESSION_COOKIE_NAME = "forgerock_session";

// Session data type
export type SessionData = {
    user: {
        id: string;
        email?: string;
        name?: string;
    };
    accessToken: string;
    idToken: string;
    refreshToken?: string;
    expiresAt: number;
};

// Default user session with fixed UUID
export const getDefaultSession = async (defaultUserId: string = DEFAULT_USER_ID, defaultEmail = DEFAULT_EMAIL): Promise<SessionData> => {
    // Create a session that expires in 24 hours
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    return {
        user: {
            id: defaultUserId,
            name: "Default User",
            email: defaultEmail,
        },
        accessToken: "default-access-token",
        idToken: "default-id-token",
        expiresAt,
    };
};

// Get login URL
export const getLoginUrl = (callbackUrl?: string): string => {
    const baseUrl = apiKey("/api/auth/signin");
    return callbackUrl ? `${baseUrl}?callbackUrl=${encodeURIComponent(callbackUrl)}` : baseUrl;
};

// Get logout URL
export const getLogoutUrl = (): string => {
    return apiKey("/api/auth/signout");
};
