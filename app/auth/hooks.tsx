"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { SessionData, getLoginUrl, getLogoutUrl } from "./session-types";
import { apiFetch } from "@/lib/utils";

// Define the authentication context type
type AuthContextType = {
  session: SessionData | null;
  status: "loading" | "authenticated" | "unauthenticated";
  signIn: (callbackUrl?: string) => void;
  signOut: (callbackUrl?: string) => void;
};

// Create the authentication context
const AuthContext = createContext<AuthContextType>({
  session: null,
  status: "loading",
  signIn: () => {},
  signOut: () => {},
});

// Authentication provider props
type AuthProviderProps = {
  children: React.ReactNode;
  session: SessionData | null;
};

// Authentication provider component
export function AuthProvider({ children, session: initialSession }: AuthProviderProps) {
  const [session, setSession] = useState<SessionData | null>(initialSession);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">(
    initialSession ? "authenticated" : "unauthenticated"
  );
  const router = useRouter();

  // Function to sign in
  const signIn = (callbackUrl: string = "/") => {
    router.push(getLoginUrl(callbackUrl));
  };

  // Function to sign out
  const signOut = (callbackUrl: string = "/") => {
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    router.push(`${getLogoutUrl()}?callbackUrl=${encodedCallbackUrl}`);
  };

  // Update the session status when the session changes
  useEffect(() => {
    setStatus(session ? "authenticated" : "unauthenticated");
  }, [session]);

  return (
    <AuthContext.Provider value={{ session, status, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use the authentication context
export function useAuth() {
  return useContext(AuthContext);
}

// Function to get the session on the server side
export async function getServerSession(): Promise<SessionData | null> {
  try {
    const response = await apiFetch("/api/auth/session", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting server session:", error);
    return null;
  }
}
