// ForgeRock auth types - no NextAuth compatibility needed

export type UserType = "regular";

// Re-export SessionData as the primary session type
export { type SessionData } from "./session-types";
