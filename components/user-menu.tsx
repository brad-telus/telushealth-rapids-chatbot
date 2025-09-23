"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/app/auth/hooks";
import { Button } from "./ui/button";

export function UserMenu() {
  const { session, signOut } = useAuth();
  const router = useRouter();
  
  if (!session) {
    return null;
  }
  
  const handleSignOut = () => {
    signOut("/");
  };
  
  return (
    <div className="flex items-center gap-4">
      <div className="text-sm">
        <span className="font-medium">{session.user.name || session.user.email || "User"}</span>
      </div>
      <Button variant="outline" size="sm" onClick={handleSignOut}>
        Sign out
      </Button>
    </div>
  );
}