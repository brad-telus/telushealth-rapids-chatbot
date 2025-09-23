"use client";

import { useAuth } from "./auth/hooks";
import { UserMenu } from "@/components/user-menu";

export default function HomePage() {
  const { session, status } = useAuth();
  
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background px-4">
        <div className="font-semibold">Telushealth Rapids Chatbot</div>
        <UserMenu />
      </header>
      
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-6 text-3xl font-bold">Welcome to Telushealth Rapids Chatbot</h1>
          
          {status === "authenticated" ? (
            <div className="rounded-lg border p-6">
              <h2 className="mb-4 text-xl font-semibold">Authentication Status</h2>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Status:</span> {status}
                </p>
                <p>
                  <span className="font-medium">User ID:</span> {session?.user.id}
                </p>
                <p>
                  <span className="font-medium">Name:</span> {session?.user.name || "N/A"}
                </p>
                <p>
                  <span className="font-medium">Email:</span> {session?.user.email || "N/A"}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border p-6">
              <h2 className="mb-4 text-xl font-semibold">Loading...</h2>
              <p>Please wait while we load your session.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}