import { createBasepathPath } from "@/lib/utils";

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

// Default user session
export const getDefaultSession = (): SessionData => {
  // Create a session that expires in 24 hours
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

  return {
    user: {
      id: "default-user",
      name: "Default User",
      email: "default@example.com",
    },
    accessToken: "default-access-token",
    idToken: "default-id-token",
    expiresAt,
  };
};

// Get login URL
export const getLoginUrl = (callbackUrl?: string): string => {
  const baseUrl = createBasepathPath("/api/auth/signin");
  return callbackUrl ? `${baseUrl}?callbackUrl=${encodeURIComponent(callbackUrl)}` : baseUrl;
};

// Get logout URL
export const getLogoutUrl = (): string => {
  return createBasepathPath("/api/auth/signout");
};