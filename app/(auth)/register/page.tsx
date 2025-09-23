"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getLoginUrl } from "@/app/auth/session";

// This file has been updated as part of the migration from NextAuth to ForgeRock
// Registration is now handled by ForgeRock, so we redirect to the login page

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the ForgeRock login page
    router.push(getLoginUrl("/"));
  }, [router]);

  return (
    <div className="flex h-dvh w-screen items-center justify-center bg-background">
      <div className="text-center">
        <p>Redirecting to ForgeRock login...</p>
      </div>
    </div>
  );
}
