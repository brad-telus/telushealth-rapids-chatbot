"use server";

import { redirect } from "next/navigation";
import { getLoginUrl } from "@/app/auth/session";

export type ForgeRockAuthState = {
    status: "idle" | "in_progress" | "success" | "failed";
};

// This file has been updated as part of the migration from NextAuth to ForgeRock
// The credential-based authentication has been removed, and only ForgeRock authentication is supported

/**
 * Redirects to the ForgeRock login page
 * @param callbackUrl The URL to redirect to after successful authentication
 */
export const loginWithForgeRock = (callbackUrl: string = "/"): void => {
    redirect(getLoginUrl(callbackUrl));
};
