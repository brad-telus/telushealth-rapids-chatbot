// Define types that match the NextAuth types to make it easier to update components

export type User = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  type?: string;
};

export type Session = {
  user: User;
  expires: string;
};

// Export the SessionData type from session.ts for convenience
export { type SessionData } from "./session";