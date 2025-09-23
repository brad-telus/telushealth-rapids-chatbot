import type { NextAuthConfig } from "next-auth";
import { basePath } from "../../next.config";

export const authConfig = {
  basePath: "/api/auth",
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
