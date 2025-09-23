import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, type SessionData, getDefaultSession } from "./session-types";

// Get session from cookie
export const getSession = async (): Promise<SessionData | null> => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    return JSON.parse(sessionCookie.value) as SessionData;
  } catch (error) {
    console.error("Error parsing session cookie:", error);
    return null;
  }
};

// Set session cookie
export const setSession = async (session: SessionData): Promise<void> => {
  const cookieStore = await cookies();

  // Calculate expiration time (subtract 5 minutes for safety margin)
  const maxAge = Math.floor((session.expiresAt - Date.now()) / 1000) - 300;

  await cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(session), {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: maxAge > 0 ? maxAge : 0,
    sameSite: "lax",
  });
};

// Clear session cookie
export const clearSession = async (): Promise<void> => {
  const cookieStore = await cookies();
  await cookieStore.delete(SESSION_COOKIE_NAME);
};

// Check if session is valid
export const isSessionValid = async (): Promise<boolean> => {
  const session = await getSession();

  if (!session) {
    return false;
  }

  // Check if session is expired (with 5 minute safety margin)
  return session.expiresAt > Date.now() + 5 * 60 * 1000;
};

// Re-export getLoginUrl and getLogoutUrl from session-types
export { getLoginUrl, getLogoutUrl } from "./session-types";
