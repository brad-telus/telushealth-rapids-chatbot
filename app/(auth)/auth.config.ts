import type { NextAuthConfig } from "next-auth";
import { createBasepathPath } from "@/lib/utils";

export const authConfig = {
  basePath: createBasepathPath("/api/auth"),
  pages: {
    signIn: createBasepathPath("/login"),
    newUser: createBasepathPath("/"),
  },
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {},
} satisfies NextAuthConfig;
