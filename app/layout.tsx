import { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "sonner";

import { AuthProvider } from "./auth/hooks";
import { getSession } from "./auth/session";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Telushealth Rapids Chatbot",
  description: "A chatbot for Telushealth Rapids",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get the session from the cookie
  const session = await getSession();

  return (
    <html lang="en" className={cn(inter.variable)}>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider session={session}>
            {children}
            <Toaster position="bottom-right" />
            <Analytics />
            <SpeedInsights />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
