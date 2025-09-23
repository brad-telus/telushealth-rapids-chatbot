"use client";

import { useAuth } from "./hooks";
import { Session, User } from "./types";

// Compatibility layer for components that rely on NextAuth

// Mimic the NextAuth useSession hook
export function useSession() {
  const { session: forgeRockSession, status } = useAuth();
  
  if (!forgeRockSession) {
    return {
      data: null,
      status,
      update: () => Promise.resolve(null),
    };
  }
  
  // Convert ForgeRock session to NextAuth session format
  const user: User = {
    id: forgeRockSession.user.id,
    name: forgeRockSession.user.name,
    email: forgeRockSession.user.email,
    type: "regular",
  };
  
  const session: Session = {
    user,
    expires: new Date(forgeRockSession.expiresAt).toISOString(),
  };
  
  return {
    data: session,
    status,
    update: () => Promise.resolve(session),
  };
}

// Mimic the NextAuth signIn function
export function signIn(provider?: string, options?: any) {
  const { signIn } = useAuth();
  const callbackUrl = options?.callbackUrl || "/";
  
  // Call the ForgeRock signIn function
  signIn(callbackUrl);
  
  // Return a promise that resolves to null (NextAuth signIn returns a promise)
  return Promise.resolve(null);
}

// Mimic the NextAuth signOut function
export function signOut(options?: any) {
  const { signOut } = useAuth();
  const callbackUrl = options?.callbackUrl || "/";
  
  // Call the ForgeRock signOut function
  signOut(callbackUrl);
  
  // Return a promise that resolves to null (NextAuth signOut returns a promise)
  return Promise.resolve(null);
}