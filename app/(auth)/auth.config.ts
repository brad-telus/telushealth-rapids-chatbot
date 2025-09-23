import type { NextAuthConfig } from "next-auth";
import { basePath } from "../../next.config";

export const authConfig = {
  basePath: "/api/auth",
  trustHost: true, // Allow NextAuth to work behind proxies and with custom base paths
  useSecureCookies: process.env.NODE_ENV === "production", // Use secure cookies in production
  pages: {
    signIn: `${basePath}/login`,
    newUser: `${basePath}/`,
  },
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {},
} satisfies NextAuthConfig;
