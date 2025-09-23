"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/toast";
import { useAuth } from "../auth/hooks";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  
  const { signIn, status } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Show error toast if there's an error in the URL
  if (error) {
    toast({
      type: "error",
      description: decodeURIComponent(error),
    });
  }
  
  // Redirect to home page if already authenticated
  if (status === "authenticated") {
    router.push(callbackUrl);
    return null;
  }
  
  const handleForgeRockLogin = () => {
    setIsLoading(true);
    signIn(callbackUrl);
  };
  
  return (
    <div className="flex h-dvh w-screen items-start justify-center bg-background pt-12 md:items-center md:pt-0">
      <div className="flex w-full max-w-md flex-col gap-12 overflow-hidden rounded-2xl">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="font-semibold text-xl dark:text-zinc-50">Sign In</h3>
          <p className="text-gray-500 text-sm dark:text-zinc-400">
            Sign in with your ForgeRock account
          </p>
        </div>
        
        <div className="flex flex-col gap-4 px-4 sm:px-16">
          <Button 
            className="w-full" 
            onClick={handleForgeRockLogin}
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in with ForgeRock"}
          </Button>
          
          <p className="mt-4 text-center text-gray-600 text-sm dark:text-zinc-400">
            By signing in, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}